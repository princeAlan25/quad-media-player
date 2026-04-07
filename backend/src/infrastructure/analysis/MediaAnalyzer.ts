import type { MediaAnalysisStats, MediaDocument } from '../../domain/media/types';

export interface MediaAnalyzer {
  enrichDocuments(documents: MediaDocument[]): Promise<{
    documents: MediaDocument[];
    stats: MediaAnalysisStats;
  }>;
}
