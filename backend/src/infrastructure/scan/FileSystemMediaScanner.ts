import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { MediaSystemScanner, SystemScanResult } from '../../application/media/contracts';
import type { MediaAnalysisStats, MediaDocument, MediaSyncSource, MediaType } from '../../domain/media/types';
import type { MediaAnalyzer } from '../analysis/MediaAnalyzer';

const COMMON_ROOT_NAMES = ['Desktop', 'Documents', 'Downloads', 'Music', 'Pictures', 'Videos'] as const;
const SKIPPED_DIRECTORY_NAMES = new Set([
  '$RECYCLE.BIN',
  'AppData',
  'Application Data',
  'Cookies',
  'Intel',
  'Local Settings',
  'Microsoft',
  'NetHood',
  'OneDriveTemp',
  'PrintHood',
  'Program Files',
  'Program Files (x86)',
  'ProgramData',
  'Recent',
  'Roaming',
  'SendTo',
  'Start Menu',
  'System Volume Information',
  'Templates',
  'Windows',
]);

const EXTENSION_MAP: Record<MediaType, string[]> = {
  audio: ['.aac', '.flac', '.m4a', '.mp3', '.ogg', '.wav', '.wma'],
  video: ['.avi', '.m4v', '.mkv', '.mov', '.mp4', '.mpeg', '.mpg', '.webm'],
  image: ['.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'],
};

const MIME_MAP: Record<string, string> = {
  '.aac': 'audio/aac',
  '.avif': 'image/avif',
  '.avi': 'video/x-msvideo',
  '.bmp': 'image/bmp',
  '.flac': 'audio/flac',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.m4a': 'audio/mp4',
  '.m4v': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.mpeg': 'video/mpeg',
  '.mpg': 'video/mpeg',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.wma': 'audio/x-ms-wma',
};

function emptyAnalysisStats(): MediaAnalysisStats {
  return {
    enabled: false,
    analyzed: 0,
    cached: 0,
    skipped: 0,
    failed: 0,
  };
}

function hashValue(value: string): string {
  return createHash('sha1').update(value).digest('hex').slice(0, 12);
}

function normalizePath(value: string): string {
  return value.split(path.sep).join('/');
}

function fileTitle(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

function toKeywords(...values: Array<string | undefined>): string[] {
  const tokens = new Set<string>();

  for (const value of values) {
    if (!value) {
      continue;
    }

    for (const token of value.toLowerCase().split(/[^a-z0-9]+/g)) {
      if (token.length >= 2) {
        tokens.add(token);
      }
    }
  }

  return Array.from(tokens).slice(0, 24);
}

function inferMediaType(fileName: string): MediaType | null {
  const extension = path.extname(fileName).toLowerCase();

  for (const [mediaType, extensions] of Object.entries(EXTENSION_MAP) as Array<[MediaType, string[]]>) {
    if (extensions.includes(extension)) {
      return mediaType;
    }
  }

  return null;
}

function mimeTypeForFile(fileName: string): string {
  return MIME_MAP[path.extname(fileName).toLowerCase()] ?? 'application/octet-stream';
}

function shouldSkipDirectory(name: string): boolean {
  return name.startsWith('.') || SKIPPED_DIRECTORY_NAMES.has(name);
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function discoverRoots(): Promise<Array<{ source: MediaSyncSource; rootPath: string }>> {
  const homeDirectory = os.homedir();
  const discoveredRoots = new Map<string, { source: MediaSyncSource; rootPath: string }>();

  const registerRoot = async (label: string, rootPath: string) => {
    const normalizedKey = rootPath.toLowerCase();
    if (discoveredRoots.has(normalizedKey) || !(await pathExists(rootPath))) {
      return;
    }

    discoveredRoots.set(normalizedKey, {
      source: {
        id: `system-${hashValue(rootPath)}`,
        label,
        mode: 'system',
      },
      rootPath,
    });
  };

  for (const rootName of COMMON_ROOT_NAMES) {
    await registerRoot(rootName, path.join(homeDirectory, rootName));
  }

  try {
    const entries = await fs.readdir(homeDirectory, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || shouldSkipDirectory(entry.name)) {
        continue;
      }

      await registerRoot(entry.name, path.join(homeDirectory, entry.name));
    }
  } catch {
    // Fall back to only the common roots if listing the home directory fails.
  }

  return Array.from(discoveredRoots.values()).sort((left, right) => left.source.label.localeCompare(right.source.label));
}

async function walkRoot(
  source: MediaSyncSource,
  rootPath: string,
): Promise<{ documents: MediaDocument[]; skippedEntries: number }> {
  const documents: MediaDocument[] = [];
  let skippedEntries = 0;

  const walkDirectory = async (currentPath: string) => {
    let entries;

    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      skippedEntries += 1;
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isSymbolicLink()) {
        skippedEntries += 1;
        continue;
      }

      if (entry.isDirectory()) {
        if (shouldSkipDirectory(entry.name)) {
          continue;
        }

        await walkDirectory(entryPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const mediaType = inferMediaType(entry.name);
      if (!mediaType) {
        continue;
      }

      try {
        const stats = await fs.stat(entryPath);
        const relativePath = normalizePath(path.relative(rootPath, entryPath) || entry.name);
        const documentId = `system-file-${hashValue(`${entryPath}|${stats.size}|${stats.mtimeMs}`)}`;

        documents.push({
          id: documentId,
          type: mediaType,
          sourceId: source.id,
          sourceLabel: source.label,
          sourceMode: 'system',
          fileName: entry.name,
          title: fileTitle(entry.name),
          ...(mediaType === 'audio' ? { artist: path.basename(path.dirname(entryPath)) } : {}),
          mimeType: mimeTypeForFile(entry.name),
          relativePath,
          size: stats.size,
          modifiedAt: Math.round(stats.mtimeMs),
          keywords: toKeywords(entry.name, relativePath, source.label),
          tags: ['system-scan', mediaType],
          filePath: entryPath,
        });
      } catch {
        skippedEntries += 1;
      }
    }
  };

  await walkDirectory(rootPath);

  return {
    documents,
    skippedEntries,
  };
}

export class FileSystemMediaScanner implements MediaSystemScanner {
  constructor(private readonly analyzer: MediaAnalyzer) {}

  async scanSystemSources(): Promise<SystemScanResult> {
    const roots = await discoverRoots();
    const summaries: SystemScanResult['summaries'] = [];
    const sourceEntries: SystemScanResult['sourceEntries'] = [];
    let skippedEntries = 0;
    let analysis = emptyAnalysisStats();

    for (const root of roots) {
      const result = await walkRoot(root.source, root.rootPath);
      const enriched = await this.analyzer.enrichDocuments(result.documents);
      skippedEntries += result.skippedEntries;
      sourceEntries.push({
        source: root.source,
        documents: enriched.documents,
      });
      summaries.push({
        source: root.source,
        rootPath: root.rootPath,
        itemCount: enriched.documents.length,
      });

      const model = enriched.stats.model ?? analysis.model;
      analysis = {
        enabled: analysis.enabled || enriched.stats.enabled,
        ...(model ? { model } : {}),
        analyzed: analysis.analyzed + enriched.stats.analyzed,
        cached: analysis.cached + enriched.stats.cached,
        skipped: analysis.skipped + enriched.stats.skipped,
        failed: analysis.failed + enriched.stats.failed,
      };
    }

    return {
      summaries,
      sourceEntries,
      skippedEntries,
      analysis,
    };
  }
}
