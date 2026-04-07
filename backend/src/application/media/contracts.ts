import type { MediaAnalysisStats, MediaIndexState, MediaSourceDocuments, MediaSyncSource } from '../../domain/media/types';

export interface MediaIndexRepository {
  readIndex(): Promise<MediaIndexState>;
  saveIndex(index: MediaIndexState): Promise<void>;
}

export interface SystemScanSummary {
  source: MediaSyncSource;
  rootPath: string;
  itemCount: number;
}

export interface SystemScanResult {
  summaries: SystemScanSummary[];
  sourceEntries: MediaSourceDocuments[];
  skippedEntries: number;
  analysis: MediaAnalysisStats;
}

export interface MediaSystemScanner {
  scanSystemSources(): Promise<SystemScanResult>;
}
