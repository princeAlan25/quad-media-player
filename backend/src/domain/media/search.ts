import type { MediaDocument, MediaSearchMatch, MediaSearchRequest } from './types';

const FIELD_WEIGHTS: Array<{ key: keyof MediaDocument; weight: number }> = [
  { key: 'title', weight: 7 },
  { key: 'fileName', weight: 6 },
  { key: 'artist', weight: 5 },
  { key: 'summary', weight: 4 },
  { key: 'transcript', weight: 4 },
  { key: 'ocrText', weight: 4 },
  { key: 'relativePath', weight: 3 },
  { key: 'sourceLabel', weight: 2 },
];

const TOKEN_PATTERN = /[a-z0-9]+/g;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return normalize(value).match(TOKEN_PATTERN) ?? [];
}

function scoreString(value: string | undefined, tokens: string[], phrase: string): number {
  if (!value) {
    return 0;
  }

  const normalized = normalize(value);
  if (!normalized) {
    return 0;
  }

  let score = 0;
  if (phrase && normalized.includes(phrase)) {
    score += 12;
  }

  const words = new Set(tokenize(value));
  for (const token of tokens) {
    if (normalized === token) {
      score += 8;
    } else if (words.has(token)) {
      score += 5;
    } else if (normalized.includes(token)) {
      score += 2;
    }
  }

  return score;
}

function scoreDocument(document: MediaDocument, query: string): number {
  const tokens = tokenize(query);
  const phrase = normalize(query);

  if (tokens.length === 0) {
    return Math.max(1, Math.round(document.modifiedAt / 86_400_000));
  }

  let score = 0;

  for (const field of FIELD_WEIGHTS) {
    const raw = document[field.key];
    if (typeof raw === 'string') {
      score += scoreString(raw, tokens, phrase) * field.weight;
    }
  }

  score += scoreString(document.keywords.join(' '), tokens, phrase) * 5;
  score += scoreString(document.tags.join(' '), tokens, phrase) * 4;
  score += scoreString(document.type, tokens, phrase) * 3;

  const recentBoost = document.modifiedAt
    ? Math.max(0, 3 - (Date.now() - document.modifiedAt) / (1000 * 60 * 60 * 24 * 30))
    : 0;
  return score + recentBoost;
}

function buildSnippet(document: MediaDocument, query: string): string {
  const phrase = normalize(query);
  const candidates = [
    document.summary,
    document.transcript,
    document.ocrText,
    document.relativePath,
    document.artist,
    document.title,
  ].filter((candidate): candidate is string => Boolean(candidate));

  const selected = candidates.find(candidate => normalize(candidate).includes(phrase)) ?? candidates[0] ?? document.fileName;
  const trimmed = selected.trim();
  if (trimmed.length <= 160) {
    return trimmed;
  }

  return `${trimmed.slice(0, 157)}...`;
}

export function searchDocuments(documents: MediaDocument[], request: MediaSearchRequest): MediaSearchMatch[] {
  const query = request.query?.trim() ?? '';
  const limit = Math.min(Math.max(request.limit ?? 8, 1), 500);
  const filteredDocuments = request.types?.length
    ? documents.filter(document => request.types?.includes(document.type))
    : documents;

  return filteredDocuments
    .map(document => ({
      id: document.id,
      type: document.type,
      sourceId: document.sourceId,
      sourceLabel: document.sourceLabel,
      title: document.title,
      fileName: document.fileName,
      relativePath: document.relativePath,
      ...(document.artist ? { artist: document.artist } : {}),
      score: scoreDocument(document, query),
      snippet: buildSnippet(document, query),
      keywords: document.keywords,
      modifiedAt: document.modifiedAt,
    }))
    .filter(match => (query ? match.score > 0 : true))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.modifiedAt - left.modifiedAt;
    })
    .slice(0, limit);
}

export function buildRagContext(documents: MediaDocument[], matches: MediaSearchMatch[]): string {
  const lookup = new Map(documents.map(document => [document.id, document]));
  return matches
    .map((match, index) => {
      const document = lookup.get(match.id);
      if (!document) {
        return `${index + 1}. ${match.type}: ${match.title}`;
      }

      const details = [
        `type=${document.type}`,
        `title=${document.title}`,
        `artist=${document.artist ?? 'unknown'}`,
        `path=${document.relativePath}`,
        `source=${document.sourceLabel}`,
        `keywords=${document.keywords.join(', ') || 'none'}`,
        `summary=${document.summary ?? 'none'}`,
        `transcript=${document.transcript ?? 'none'}`,
        `ocr=${document.ocrText ?? 'none'}`,
      ];

      return `${index + 1}. ${details.join(' | ')}`;
    })
    .join('\n');
}
