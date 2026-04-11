import {
  buildStats,
  findMediaDocumentById,
  removeDocumentsForSource,
  replaceDocumentsForSources,
  toPublicDocument,
  validateDocuments,
} from '../../domain/media/catalog';
import { buildRagContext, searchDocuments } from '../../domain/media/search';
import type {
  MediaDocument,
  MediaSearchRequest,
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

  async searchMedia(request: MediaSearchRequest) {
    const index = await this.indexRepository.readIndex();
    const matches = searchDocuments(index.documents, request);

    return {
      query: request.query ?? '',
      matches,
      stats: buildStats(index.documents, index.updatedAt),
    };
  }

  async buildRagMedia(request: MediaSearchRequest) {
    const index = await this.indexRepository.readIndex();
    const matches = searchDocuments(index.documents, request);
    const context = buildRagContext(index.documents, matches);

    return {
      query: request.query ?? '',
      matches,
      context,
      stats: buildStats(index.documents, index.updatedAt),
    };
  }

  async searchJamendo(query: string, limit: number) {
    const clientId = process.env.JAMENDO_CLIENT_ID || '56d30c95';
    const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=jsonpretty&limit=${limit}&search=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Jamendo API failed with status ${response.status}`);
    }
    
    const data = (await response.json()) as { results?: any[] };
    const results = data.results || [];
    
    const documents: MediaDocument[] = results.map((track: any) => ({
      id: `jamendo-${track.id}`,
      type: 'audio',
      sourceId: 'jamendo',
      sourceLabel: 'Jamendo Music',
      sourceMode: 'system',
      fileName: `${track.name}.mp3`,
      title: track.name,
      artist: track.artist_name,
      mimeType: 'audio/mpeg',
      relativePath: track.audio,
      size: 0,
      modifiedAt: Date.now(),
      keywords: [track.artist_name, ...(track.tags || []).map((t: any) => t.name || t)],
      tags: ['jamendo', 'audio']
    }));

    return {
      query,
      documents
    };
  }

  async searchYouTube(query: string, limit: number) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || apiKey === 'your_youtube_api_key_here') {
      throw new Error(`YOUTUBE_API_KEY is not configured in the backend environment.`);
    }

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${limit}&type=video&key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API failed with status ${response.status}`);
    }
    
    const data = (await response.json()) as { items?: any[] };
    const items = data.items || [];
    
    const documents: MediaDocument[] = items.map((item: any) => ({
      id: `youtube-${item.id.videoId}`,
      type: 'video',
      sourceId: 'youtube',
      sourceLabel: 'YouTube',
      sourceMode: 'system',
      fileName: `${item.snippet.title}.mp4`,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      mimeType: 'video/mp4',
      relativePath: item.id.videoId,
      size: 0,
      modifiedAt: Date.now(),
      keywords: [item.snippet.channelTitle, 'youtube', 'video'],
      tags: ['youtube', 'video']
    }));

    return {
      query,
      documents
    };
  }
}
