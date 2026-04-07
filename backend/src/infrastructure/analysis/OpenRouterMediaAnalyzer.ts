import { promises as fs } from 'node:fs';
import type { MediaAnalysisStats, MediaDocument } from '../../domain/media/types';
import { DATA_DIRECTORY, MEDIA_ANALYSIS_CACHE_FILE } from '../config/paths';
import type { MediaAnalyzer } from './MediaAnalyzer';

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/avif',
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const SUPPORTED_VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
]);

const DEFAULT_ANALYSIS_MODEL = 'openai/gpt-4.1-mini';
const DEFAULT_MAX_ITEMS_PER_SCAN = 24;
const DEFAULT_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const DEFAULT_MAX_VIDEO_BYTES = 20 * 1024 * 1024;

interface MediaAnalysisRecord {
  updatedAt: string;
  model?: string;
  summary?: string;
  transcript?: string;
  ocrText?: string;
  keywords: string[];
  tags: string[];
  skippedReason?: string;
}

interface MediaAnalysisCacheState {
  version: 1;
  records: Record<string, MediaAnalysisRecord>;
}

interface MediaAnalysisConfig {
  enabled: boolean;
  model: string;
  maxItemsPerScan: number;
  maxImageBytes: number;
  maxVideoBytes: number;
}

interface OpenRouterMessageTextItem {
  type: 'text';
  text: string;
}

interface OpenRouterMessageImageItem {
  type: 'image_url';
  imageUrl: {
    url: string;
    detail?: 'auto' | 'high' | 'low';
  };
}

interface OpenRouterMessageVideoItem {
  type: 'input_video';
  videoUrl: {
    url: string;
  };
}

interface OpenRouterChatResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }> | null;
    };
  }>;
}

interface OpenRouterClient {
  chat: {
    send(request: {
      model?: string;
      messages: Array<{
        role: 'system' | 'user';
        content: string | Array<OpenRouterMessageTextItem | OpenRouterMessageImageItem | OpenRouterMessageVideoItem>;
      }>;
      responseFormat?: { type: 'json_object' };
      maxTokens?: number;
      temperature?: number;
      provider?: {
        zdr?: boolean;
        requireParameters?: boolean;
        allowFallbacks?: boolean;
      };
    }): Promise<OpenRouterChatResponse>;
  };
}

interface OpenRouterModule {
  OpenRouter: new (options?: {
    apiKey?: string;
    httpReferer?: string;
    xTitle?: string;
    timeoutMs?: number;
  }) => OpenRouterClient;
}

interface AnalysisPayload {
  summary?: string;
  transcript?: string;
  ocrText?: string;
  keywords: string[];
  tags: string[];
}

const EMPTY_CACHE: MediaAnalysisCacheState = {
  version: 1,
  records: {},
};

let openRouterClientPromise: Promise<OpenRouterClient> | null = null;

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

function normalizeList(value: unknown, limit: number): string[] {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\n,;]+/g)
      : [];

  const normalized = new Set<string>();
  for (const item of items) {
    if (typeof item !== 'string') {
      continue;
    }

    const clean = item
      .toLowerCase()
      .replace(/[_/]+/g, ' ')
      .replace(/[^a-z0-9\s-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (clean.length >= 2) {
      normalized.add(clean.slice(0, 48));
    }

    if (normalized.size >= limit) {
      break;
    }
  }

  return Array.from(normalized);
}

function getConfig(): MediaAnalysisConfig {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const enabledFlag = (process.env.MEDIA_ANALYSIS_ENABLED ?? 'true').trim().toLowerCase();

  return {
    enabled: Boolean(apiKey) && enabledFlag !== 'false' && enabledFlag !== '0' && enabledFlag !== 'off',
    model: process.env.OPENROUTER_VISION_MODEL?.trim() || DEFAULT_ANALYSIS_MODEL,
    maxItemsPerScan: parsePositiveInteger(process.env.MEDIA_ANALYSIS_MAX_ITEMS_PER_SCAN, DEFAULT_MAX_ITEMS_PER_SCAN),
    maxImageBytes: parsePositiveInteger(process.env.MEDIA_ANALYSIS_MAX_IMAGE_BYTES, DEFAULT_MAX_IMAGE_BYTES),
    maxVideoBytes: parsePositiveInteger(process.env.MEDIA_ANALYSIS_MAX_VIDEO_BYTES, DEFAULT_MAX_VIDEO_BYTES),
  };
}

async function ensureCacheStore(): Promise<void> {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });
}

async function readCache(): Promise<MediaAnalysisCacheState> {
  await ensureCacheStore();

  try {
    const raw = await fs.readFile(MEDIA_ANALYSIS_CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<MediaAnalysisCacheState>;

    return {
      version: 1,
      records: parsed.records && typeof parsed.records === 'object' ? parsed.records : {},
    };
  } catch {
    return {
      version: EMPTY_CACHE.version,
      records: {},
    };
  }
}

async function writeCache(cache: MediaAnalysisCacheState): Promise<void> {
  await ensureCacheStore();
  await fs.writeFile(MEDIA_ANALYSIS_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

function extractResponseText(response: OpenRouterChatResponse): string {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map(item => (item && typeof item.text === 'string' ? item.text : ''))
    .join('\n')
    .trim();
}

function parseAnalysisPayload(rawText: string): AnalysisPayload | null {
  const withoutFence = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const jsonCandidate = (() => {
    if (withoutFence.startsWith('{') && withoutFence.endsWith('}')) {
      return withoutFence;
    }

    const match = withoutFence.match(/\{[\s\S]*\}/);
    return match?.[0] ?? '';
  })();

  if (!jsonCandidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonCandidate) as Record<string, unknown>;
    const summary = normalizeText(parsed.summary, 220);
    const transcript = normalizeText(parsed.transcript, 260);
    const ocrText = normalizeText(parsed.ocrText, 260);

    return {
      ...(summary ? { summary } : {}),
      ...(transcript ? { transcript } : {}),
      ...(ocrText ? { ocrText } : {}),
      keywords: normalizeList(parsed.keywords, 12),
      tags: normalizeList(parsed.tags, 8),
    };
  } catch {
    return null;
  }
}

function hasAnalysisMetadata(record: MediaAnalysisRecord): boolean {
  return Boolean(record.summary || record.transcript || record.ocrText || record.keywords.length > 0 || record.tags.length > 0);
}

function applyRecord(document: MediaDocument, record: MediaAnalysisRecord): MediaDocument {
  const keywords = Array.from(new Set([...document.keywords, ...record.keywords])).slice(0, 40);
  const tags = Array.from(new Set([...document.tags, ...record.tags])).slice(0, 20);

  return {
    ...document,
    ...(record.summary ? { summary: record.summary } : {}),
    ...(record.transcript ? { transcript: record.transcript } : {}),
    ...(record.ocrText ? { ocrText: record.ocrText } : {}),
    keywords,
    tags,
  };
}

function isAnalyzableDocument(document: MediaDocument): boolean {
  if (!document.filePath) {
    return false;
  }

  return document.type === 'image' || document.type === 'video';
}

function cacheKeyForDocument(document: MediaDocument): string {
  return document.id;
}

function createSkipRecord(reason: string): MediaAnalysisRecord {
  return {
    updatedAt: new Date().toISOString(),
    keywords: [],
    tags: [],
    skippedReason: reason,
  };
}

function buildAnalysisPrompt(document: MediaDocument): string {
  const transcriptInstruction = document.type === 'video'
    ? 'transcript: only include brief speech or subtitle text when it is clearly understandable; otherwise use an empty string.'
    : 'transcript: always use an empty string for images.';

  return [
    `Analyze this ${document.type} file for a local media-library search index.`,
    `File name: ${document.fileName}`,
    `Relative path: ${document.relativePath}`,
    'Return strict JSON with exactly these keys: summary, transcript, ocrText, keywords, tags.',
    'summary: one short sentence under 30 words describing the main subject, scene, or action.',
    transcriptInstruction,
    'ocrText: readable text visible in the media only; otherwise use an empty string.',
    'keywords: 6 to 12 lowercase search phrases that would help a user find this media later.',
    'tags: 2 to 8 lowercase category labels like portrait, concert, screenshot, wedding, church, sports, pet, landscape, document.',
    'Do not invent people names, places, or dialogue. Do not use markdown.',
  ].join('\n');
}

function isGlobalFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes('api key') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('timeout') ||
    message.includes('fetch failed') ||
    message.includes('network')
  );
}

async function readDataUrl(document: MediaDocument, config: MediaAnalysisConfig): Promise<{ dataUrl: string } | { reason: string }> {
  if (!document.filePath) {
    return { reason: 'missing-file-path' };
  }

  if (document.type === 'image') {
    if (!SUPPORTED_IMAGE_MIME_TYPES.has(document.mimeType)) {
      return { reason: 'unsupported-image-format' };
    }

    if (document.size > config.maxImageBytes) {
      return { reason: 'image-too-large' };
    }
  }

  if (document.type === 'video') {
    if (!SUPPORTED_VIDEO_MIME_TYPES.has(document.mimeType)) {
      return { reason: 'unsupported-video-format' };
    }

    if (document.size > config.maxVideoBytes) {
      return { reason: 'video-too-large' };
    }
  }

  const fileBuffer = await fs.readFile(document.filePath);
  return {
    dataUrl: `data:${document.mimeType};base64,${fileBuffer.toString('base64')}`,
  };
}

async function getOpenRouterClient(): Promise<OpenRouterClient> {
  if (!openRouterClientPromise) {
    openRouterClientPromise = (async () => {
      const dynamicImport = new Function('specifier', 'return import(specifier);') as (specifier: string) => Promise<OpenRouterModule>;
      const { OpenRouter } = await dynamicImport('@openrouter/sdk');
      const apiKey = process.env.OPENROUTER_API_KEY?.trim();

      return new OpenRouter({
        ...(apiKey ? { apiKey } : {}),
        ...(process.env.OPENROUTER_HTTP_REFERER?.trim() ? { httpReferer: process.env.OPENROUTER_HTTP_REFERER.trim() } : {}),
        ...(process.env.OPENROUTER_APP_TITLE?.trim() ? { xTitle: process.env.OPENROUTER_APP_TITLE.trim() } : {}),
        timeoutMs: 45_000,
      });
    })();
  }

  return openRouterClientPromise;
}

async function analyzeDocument(
  document: MediaDocument,
  dataUrl: string,
  config: MediaAnalysisConfig,
): Promise<MediaAnalysisRecord> {
  const client = await getOpenRouterClient();
  const mediaItem: OpenRouterMessageImageItem | OpenRouterMessageVideoItem = document.type === 'image'
    ? {
        type: 'image_url',
        imageUrl: {
          url: dataUrl,
          detail: 'auto',
        },
      }
    : {
        type: 'input_video',
        videoUrl: {
          url: dataUrl,
        },
      };

  const response = await client.chat.send({
    model: config.model,
    messages: [
      {
        role: 'system',
        content: 'You create compact, factual JSON metadata for local media search. Return JSON only.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildAnalysisPrompt(document),
          },
          mediaItem,
        ],
      },
    ],
    responseFormat: { type: 'json_object' },
    maxTokens: 320,
    temperature: 0.1,
    provider: {
      zdr: true,
      requireParameters: true,
      allowFallbacks: true,
    },
  });

  const responseText = extractResponseText(response);
  const payload = parseAnalysisPayload(responseText);
  if (!payload) {
    throw new Error(`Failed to parse media analysis response for ${document.fileName}.`);
  }

  return {
    updatedAt: new Date().toISOString(),
    model: config.model,
    ...(payload.summary ? { summary: payload.summary } : {}),
    ...(payload.transcript ? { transcript: payload.transcript } : {}),
    ...(payload.ocrText ? { ocrText: payload.ocrText } : {}),
    keywords: payload.keywords,
    tags: payload.tags,
  };
}

export class OpenRouterMediaAnalyzer implements MediaAnalyzer {
  async enrichDocuments(documents: MediaDocument[]): Promise<{ documents: MediaDocument[]; stats: MediaAnalysisStats }> {
    const config = getConfig();
    const stats: MediaAnalysisStats = {
      enabled: config.enabled,
      ...(config.enabled ? { model: config.model } : {}),
      analyzed: 0,
      cached: 0,
      skipped: 0,
      failed: 0,
    };

    if (documents.length === 0) {
      return { documents, stats };
    }

    const cache = await readCache();
    let cacheChanged = false;
    const nextDocuments = [...documents];
    const candidates: Array<{ index: number; document: MediaDocument }> = [];

    for (const [index, document] of nextDocuments.entries()) {
      if (!isAnalyzableDocument(document)) {
        continue;
      }

      const cachedRecord = cache.records[cacheKeyForDocument(document)];
      if (cachedRecord) {
        if (hasAnalysisMetadata(cachedRecord)) {
          nextDocuments[index] = applyRecord(document, cachedRecord);
          stats.cached += 1;
        } else {
          stats.skipped += 1;
        }

        continue;
      }

      candidates.push({ index, document });
    }

    if (!config.enabled || candidates.length === 0) {
      return { documents: nextDocuments, stats };
    }

    candidates.sort((left, right) => {
      if (left.document.type !== right.document.type) {
        return left.document.type === 'image' ? -1 : 1;
      }

      if (left.document.modifiedAt !== right.document.modifiedAt) {
        return right.document.modifiedAt - left.document.modifiedAt;
      }

      return left.document.size - right.document.size;
    });

    let analyzedThisPass = 0;

    for (const [candidateIndex, candidate] of candidates.entries()) {
      if (analyzedThisPass >= config.maxItemsPerScan) {
        stats.skipped += candidates.length - candidateIndex;
        break;
      }

      const key = cacheKeyForDocument(candidate.document);
      const mediaInput = await readDataUrl(candidate.document, config);
      if ('reason' in mediaInput) {
        cache.records[key] = createSkipRecord(mediaInput.reason);
        cacheChanged = true;
        stats.skipped += 1;
        continue;
      }

      try {
        const record = await analyzeDocument(candidate.document, mediaInput.dataUrl, config);
        cache.records[key] = record;
        nextDocuments[candidate.index] = applyRecord(candidate.document, record);
        cacheChanged = true;
        analyzedThisPass += 1;
        stats.analyzed += 1;
      } catch (error) {
        stats.failed += 1;

        if (isGlobalFailure(error)) {
          break;
        }
      }
    }

    if (cacheChanged) {
      await writeCache(cache);
    }

    return {
      documents: nextDocuments,
      stats,
    };
  }
}
