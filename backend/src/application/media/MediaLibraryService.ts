import {
  buildStats,
  findMediaDocumentById,
  removeDocumentsForSource,
  replaceDocumentsForSources,
  toPublicDocument,
  validateDocuments,
} from '../../domain/media/catalog';
import type {
  MediaDocument,
  MediaSyncSource,
  MediaType,
} from '../../domain/media/types';
import type { MediaIndexRepository } from './contracts';

interface MediaLibraryServiceDependencies {
  indexRepository: MediaIndexRepository;
}

export class MediaLibraryService {
  private readonly indexRepository: MediaIndexRepository;

  constructor({ indexRepository }: MediaLibraryServiceDependencies) {
    this.indexRepository = indexRepository;
  }

  async getHealth() {
    const index = await this.indexRepository.readIndex();
    return {
      ok: true,
      stats: buildStats(index.documents, index.updatedAt),
    };
  }

  async listMedia(types: MediaType[] = []) {
    const index = await this.indexRepository.readIndex();
    const documents = types.length
      ? index.documents.filter(document => types.includes(document.type))
      : index.documents;

    return {
      documents: documents.map(toPublicDocument),
      stats: buildStats(documents, index.updatedAt),
    };
  }

  async getMediaItem(mediaId: string) {
    const index = await this.indexRepository.readIndex();
    const document = findMediaDocumentById(index.documents, mediaId);

    if (!document) {
      return null;
    }

    return {
      document: toPublicDocument(document),
    };
  }

  async getMediaItems(ids: string[]) {
    const index = await this.indexRepository.readIndex();
    const documentsById = new Map(index.documents.map(document => [document.id, document]));
    const documents = ids
      .map(id => documentsById.get(id))
      .filter((document): document is MediaDocument => Boolean(document))
      .map(toPublicDocument);

    return { documents };
  }

  async syncMediaSource(source: MediaSyncSource, documents: MediaDocument[]) {
    validateDocuments(documents);
    const current = await this.indexRepository.readIndex();
    const nextIndex = replaceDocumentsForSources(current, [{ source, documents }]);
    await this.indexRepository.saveIndex(nextIndex);

    return {
      sourceId: source.id,
      synced: documents.length,
      stats: buildStats(nextIndex.documents, nextIndex.updatedAt),
    };
  }

  async removeMediaSource(sourceId: string) {
    const current = await this.indexRepository.readIndex();
    const nextIndex = removeDocumentsForSource(current, sourceId);
    await this.indexRepository.saveIndex(nextIndex);

    return {
      sourceId,
      stats: buildStats(nextIndex.documents, nextIndex.updatedAt),
    };
  }
}
