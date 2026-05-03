import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRotateRight, FaFolderOpen, FaTrash } from 'react-icons/fa6';
import type { AudioItem } from '@/shared/types/AudioItem';
import type { ImageItem } from '@/shared/types/ImageItem';
import type { VideoItem } from '@/shared/types/VideoItem';
import { fetchBackendHealth, fetchMediaDocument, fetchMediaDocuments, fetchMediaLibrary, fetchRagContext, searchMediaLibrary, searchJamendoMusic, searchYouTubeVideo, sendAiChat } from '@/shared/api/backendApi';
import { useMediaLibrary } from '@/entities/media';
import type { BackendMediaDocument, BackendMediaMatch, BackendMediaStats, MediaKind } from '@/shared/types/LibraryMedia';
import type { PuterChatMessage, PuterChatResponse, PuterToolCall, PuterToolDefinition } from '@/shared/types/puter';
import { RiMenuFill } from 'react-icons/ri';
import { BiSolidSend } from 'react-icons/bi';
import { CgCloseR } from 'react-icons/cg';
import { VscLoading } from 'react-icons/vsc';

type ChatRole = 'assistant' | 'user' | 'tool';

interface ChatLine {
  id: string;
  role: ChatRole | 'typing';
  content: string;
  metadata?: {
    documents?: BackendMediaDocument[];
  };
}

const glassPanelClass = 'agent-light-panel rounded-3xl border backdrop-blur-xl'

function routeForMedia(type: MediaKind): string {
  if (type === 'audio') return '/';
  if (type === 'video') return '/video';
  return '/image';
}

function extractAssistantText(response: string | PuterChatResponse): string {
  if (typeof response === 'string') {
    return response;
  }

  if (typeof response.message?.content === 'string') {
    return response.message.content;
  }

  if (typeof response.text === 'string') {
    return response.text;
  }

  return 'No response returned.';
}

function extractAssistantMessage(response: string | PuterChatResponse): PuterChatMessage {
  if (typeof response === 'string') {
    return {
      role: 'assistant',
      content: response,
    };
  }

  return response.message ?? {
    role: 'assistant',
    content: response.text ?? '',
  };
}

export const AgentPage = () => {
  const navigate = useNavigate();
  const {
    audios,
    videos,
    images,
    addAudios,
    addVideos,
    addImages,
    syncedSources,
    syncState,
    supportsDirectorySync,
    connectCustomDirectorySource,
    connectSuggestedDirectorySources,
    rescanDirectorySources,
    removeMediaSource,
    requestMediaFocus,
  } = useMediaLibrary();

  const [backendStats, setBackendStats] = useState<BackendMediaStats | null>(null);
  const [query, setQuery] = useState('');
  const [chatLines, setChatLines] = useState<ChatLine[]>([
    {
      id: 'assistant-seed',
      role: 'assistant',
      content: "I'm your AI Agent. I can find and play any video from YouTube and play any audio from external source and manage your browser local folders and library automatically. Just tell me what you need—I'll play, show and search for you",
    },
  ]);
  const [conversation, setConversation] = useState<PuterChatMessage[]>([
    {
      role: 'system',
      content: 'You are a media RAG assistant for a cloud media player. Search across the synchronized media index. Use search_media to inspect results, use collect_media when the user wants many or all matching files loaded into the app, use open_media to focus one exact item, and never invent IDs or claim files exist unless a tool returns them. If the user asks for new music, songs, or artists, you must use search_jamendo_music. If the user asks for new videos, movies, or clips, you must use search_youtube_video to find and stream real videos directly from the cloud. Be concise and practical.',
    },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [showSideBar, setShowSideBar] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const localCounts = useMemo(() => ({
    audio: audios.length,
    video: videos.length,
    image: images.length,
  }), [audios.length, images.length, videos.length]);

  const refreshBackendIndexStats = useCallback(async () => {
    try {
      const health = await fetchBackendHealth();
      setBackendStats(health.stats);
    } catch {
      setBackendStats(null);
    }
  }, []);

  useEffect(() => {
    void refreshBackendIndexStats();
  }, [refreshBackendIndexStats, syncState.lastSyncedAt]);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [chatLines, isRunning]);

  const addBackendDocumentsToLibrary = useCallback((
    documents: BackendMediaDocument[],
    options?: { openFirst?: boolean },
  ) => {
    const uniqueDocuments = Array.from(new Map(documents.map(document => [document.id, document])).values());
    const loadedIds = new Set([
      ...audios.map(item => item.id),
      ...videos.map(item => item.id),
      ...images.map(item => item.id),
    ]);

    const openableDocuments = uniqueDocuments;
    const documentsToAdd = openableDocuments.filter(document =>
      !loadedIds.has(document.id),
    );

    const audioItems: AudioItem[] = [];
    const videoItems: VideoItem[] = [];
    const imageItems: ImageItem[] = [];

    for (const document of documentsToAdd) {
      const backendUrl = document.sourceId === 'jamendo' ? document.relativePath : document.relativePath;

      if (document.type === 'audio') {
        audioItems.push({
          id: document.id,
          title: document.title,
          artist: document.artist ?? document.sourceLabel,
          url: backendUrl,
          mimeType: document.mimeType,
          size: document.size,
          modifiedAt: document.modifiedAt,
          durationSeconds: document.durationSeconds,
          relativePath: document.relativePath,
          sourceId: document.sourceId,
          sourceLabel: document.sourceLabel,
          origin: 'backend-scan' as const,
          summary: document.summary,
          transcript: document.transcript,
          ocrText: document.ocrText,
          keywords: document.keywords,
        });
        continue;
      }

      if (document.type === 'video') {
        videoItems.push({
          id: document.id,
          name: document.fileName,
          url: backendUrl,
          mimeType: document.mimeType,
          size: document.size,
          modifiedAt: document.modifiedAt,
          durationSeconds: document.durationSeconds,
          width: document.width,
          height: document.height,
          relativePath: document.relativePath,
          sourceId: document.sourceId,
          sourceLabel: document.sourceLabel,
          origin: 'backend-scan' as const,
          summary: document.summary,
          transcript: document.transcript,
          keywords: document.keywords,
        });
        continue;
      }

      imageItems.push({
        id: document.id,
        name: document.fileName,
        url: backendUrl,
        mimeType: document.mimeType,
        size: document.size,
        modifiedAt: document.modifiedAt,
        width: document.width,
        height: document.height,
        relativePath: document.relativePath,
        sourceId: document.sourceId,
        sourceLabel: document.sourceLabel,
        origin: 'backend-scan' as const,
        summary: document.summary,
        ocrText: document.ocrText,
        keywords: document.keywords,
      });
    }

    if (audioItems.length > 0) {
      addAudios(audioItems);
    }
    if (videoItems.length > 0) {
      addVideos(videoItems);
    }
    if (imageItems.length > 0) {
      addImages(imageItems);
    }

    const openedDocument = options?.openFirst ? openableDocuments[0] : undefined;
    if (openedDocument) {
      requestMediaFocus(openedDocument.type, openedDocument.id, openedDocument.type !== 'image');
      navigate(routeForMedia(openedDocument.type));
    }

    return {
      ok: openableDocuments.length > 0,
      matched: uniqueDocuments.length,
      available: openableDocuments.length,
      added: documentsToAdd.length,
      alreadyLoaded: openableDocuments.filter(document => loadedIds.has(document.id)).length,
      unavailable: uniqueDocuments.length - openableDocuments.length,
      collected: {
        audio: audioItems.length,
        video: videoItems.length,
        image: imageItems.length,
      },
      opened: openedDocument
        ? {
          id: openedDocument.id,
          title: openedDocument.title,
          type: openedDocument.type,
        }
        : null,
    };
  }, [addAudios, addImages, addVideos, audios, images, navigate, requestMediaFocus, videos]);

  const toolDefinitions = useMemo<PuterToolDefinition[]>(() => ([
    {
      type: 'function',
      function: {
        name: 'search_media',
        description: 'Search the synchronized media index and return the best matching files.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'What media to search for.' },
            types: {
              type: 'array',
              items: { type: 'string', enum: ['audio', 'video', 'image'] },
              description: 'Optional media types to filter by.',
            },
            limit: { type: 'number', description: 'Maximum number of results to return.' },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'collect_media',
        description: 'Collect many matching files from the indexed PC media library into the app at once and optionally open the first result.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Optional search text for the media to collect.' },
            types: {
              type: 'array',
              items: { type: 'string', enum: ['audio', 'video', 'image'] },
              description: 'Optional media types to filter by.',
            },
            limit: { type: 'number', description: 'Maximum number of matches to collect when a query is provided.' },
            allMatches: {
              type: 'boolean',
              description: 'When true, collect every indexed file for the filter, or up to 500 search matches when a query is provided.',
            },
            openFirst: {
              type: 'boolean',
              description: 'When true, open the first collected result in the player.',
            },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_library',
        description: 'Return the currently loaded library counts and a small preview of items.',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['audio', 'video', 'image'],
              description: 'Optional single media type to focus on.',
            },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'open_media',
        description: 'Focus a specific media item in the player UI using the exact media id returned from search_media.',
        parameters: {
          type: 'object',
          properties: {
            mediaId: { type: 'string', description: 'The exact media id to open.' },
          },
          required: ['mediaId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'refresh_library',
        description: 'Rescan already-connected browser directories and refresh the local index.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_jamendo_music',
        description: 'Search Jamendo for new music/songs/artists to stream from the cloud. Returns a list of playable audio tracks.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The song title, artist, or genre to search for.' },
            limit: { type: 'number', description: 'Maximum number of tracks to return. Default 10.' },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_youtube_video',
        description: 'Search YouTube for new videos to stream from the cloud. Returns a list of playable video tracks.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The video title or topic to search for.' },
            limit: { type: 'number', description: 'Maximum number of videos to return. Default 10.' },
          },
          required: ['query'],
        },
      },
    },
  ]), []);

  const executeToolCall = useCallback(async (toolCall: PuterToolCall) => {
    const args = JSON.parse(toolCall.function.arguments || '{}') as Record<string, unknown>;

    if (toolCall.function.name === 'search_youtube_video') {
      const result = await searchYouTubeVideo(
        String(args.query ?? ''),
        typeof args.limit === 'number' ? args.limit : 10,
      );
      return {
        query: result.query,
        ...addBackendDocumentsToLibrary(result.documents, { openFirst: true }),
      };
    }

    if (toolCall.function.name === 'search_jamendo_music') {
      const result = await searchJamendoMusic(
        String(args.query ?? ''),
        typeof args.limit === 'number' ? args.limit : 10,
      );
      return {
        query: result.query,
        ...addBackendDocumentsToLibrary(result.documents, { openFirst: true }),
      };
    }

    if (toolCall.function.name === 'search_media') {
      const result = await fetchRagContext(
        String(args.query ?? ''),
        Array.isArray(args.types) ? args.types as MediaKind[] : undefined,
        typeof args.limit === 'number' ? args.limit : 8,
      );
      return result;
    }

    if (toolCall.function.name === 'collect_media') {
      const queryText = typeof args.query === 'string' ? args.query.trim() : '';
      const requestedTypes = Array.isArray(args.types) ? args.types as MediaKind[] : undefined;
      const requestedLimit = typeof args.limit === 'number'
        ? Math.min(Math.max(Math.floor(args.limit), 1), 500)
        : 25;
      const allMatches = args.allMatches === true;
      const openFirst = typeof args.openFirst === 'boolean' ? args.openFirst : true;

      let documents: BackendMediaDocument[] = [];

      if (queryText) {
        const searchResult = await searchMediaLibrary(
          queryText,
          requestedTypes,
          allMatches ? 500 : requestedLimit,
        );
        const matchedIds = searchResult.matches.map(match => match.id);
        const libraryResult = await fetchMediaDocuments(matchedIds);
        documents = libraryResult.documents;
      } else {
        const libraryResult = await fetchMediaLibrary(requestedTypes);
        documents = allMatches ? libraryResult.documents : libraryResult.documents.slice(0, requestedLimit);
      }

      return {
        query: queryText,
        ...addBackendDocumentsToLibrary(documents, { openFirst }),
      };
    }

    if (toolCall.function.name === 'list_library') {
      const requestedType = typeof args.type === 'string' ? args.type as MediaKind : undefined;
      const items = requestedType === 'audio'
        ? audios.map(item => ({ id: item.id, title: item.title }))
        : requestedType === 'video'
          ? videos.map(item => ({ id: item.id, title: item.name }))
          : requestedType === 'image'
            ? images.map(item => ({ id: item.id, title: item.name }))
            : [
              ...audios.slice(0, 3).map(item => ({ id: item.id, title: item.title, type: 'audio' })),
              ...videos.slice(0, 3).map(item => ({ id: item.id, title: item.name, type: 'video' })),
              ...images.slice(0, 3).map(item => ({ id: item.id, title: item.name, type: 'image' })),
            ];

      return {
        counts: localCounts,
        items: items.slice(0, 10),
      };
    }

    if (toolCall.function.name === 'open_media') {
      const mediaId = String(args.mediaId ?? '');
      const audio = audios.find(item => item.id === mediaId);
      if (audio) {
        requestMediaFocus('audio', audio.id, true);
        navigate(routeForMedia('audio'));
        return { ok: true, route: routeForMedia('audio'), media: { id: audio.id, title: audio.title, type: 'audio' } };
      }

      const video = videos.find(item => item.id === mediaId);
      if (video) {
        requestMediaFocus('video', video.id, true);
        navigate(routeForMedia('video'));
        return { ok: true, route: routeForMedia('video'), media: { id: video.id, title: video.name, type: 'video' } };
      }

      const image = images.find(item => item.id === mediaId);
      if (image) {
        requestMediaFocus('image', image.id, false);
        navigate(routeForMedia('image'));
        return { ok: true, route: routeForMedia('image'), media: { id: image.id, title: image.name, type: 'image' } };
      }

      const { document } = await fetchMediaDocument(mediaId);
      const collection = addBackendDocumentsToLibrary([document], { openFirst: true });
      return {
        ...collection,
        route: routeForMedia(document.type),
        media: { id: document.id, title: document.title, type: document.type },
      };
    }

    if (toolCall.function.name === 'refresh_library') {
      if (syncedSources.length > 0) {
        await rescanDirectorySources();
      }
      return {
        ok: true,
        syncedSources: syncedSources.length,
      };
    }

    return { ok: false, error: `Unknown tool: ${toolCall.function.name}` };
  }, [addBackendDocumentsToLibrary, audios, images, localCounts, navigate, requestMediaFocus, rescanDirectorySources, syncedSources.length, videos]);

  const sendPromptToAgent = useCallback(async () => {
    const prompt = query.trim();
    if (!prompt || isRunning) {
      return;
    }

    setQuery('');
    setIsRunning(true);
    setChatLines(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: prompt }]);

    let workingConversation: PuterChatMessage[] = [
      ...conversation,
      { role: 'user', content: prompt },
    ];

    try {
      for (let step = 0; step < 10; step += 1) {
        const response = await sendAiChat(workingConversation, {
          tools: toolDefinitions,
        });

        const assistantMessage = extractAssistantMessage(response);
        const toolCalls = assistantMessage.tool_calls ?? [];

        if (toolCalls.length === 0) {
          const text = extractAssistantText(response);
          setChatLines(prev => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: text }]);
          workingConversation = [...workingConversation, { role: 'assistant', content: text }];
          setConversation(workingConversation);
          setIsRunning(false);
          return;
        }

        workingConversation = [...workingConversation, assistantMessage];
        let foundDocuments: BackendMediaDocument[] = [];

        for (const toolCall of toolCalls) {
          const result = await executeToolCall(toolCall);
          let summary = `Ran ${toolCall.function.name}.`;

          // Track documents to display them in the chat
          if (toolCall.function.name === 'search_media') {
            const searchResult = result as { matches?: BackendMediaMatch[] };
            const matchedIds = (searchResult.matches ?? []).map(m => m.id);
            const { documents } = await fetchMediaDocuments(matchedIds);
            foundDocuments = [...foundDocuments, ...documents];
            summary = `Found ${documents.length} matches in the library.`;
          } else if (toolCall.function.name === 'search_jamendo_music' || toolCall.function.name === 'search_youtube_video') {
            const mediaResult = result as { documents?: BackendMediaDocument[] };
            foundDocuments = [...foundDocuments, ...(mediaResult.documents ?? [])];
            summary = `Found ${mediaResult.documents?.length ?? 0} new cloud sources.`;
          } else if (toolCall.function.name === 'collect_media') {
            const collectResult = result as {
              matched?: number;
              added?: number;
              documents?: BackendMediaDocument[];
              opened?: { title?: string } | null;
            };
            if (collectResult.documents) {
              foundDocuments = [...foundDocuments, ...collectResult.documents];
            }

            if ((collectResult.matched ?? 0) === 0) {
              summary = 'No matching media files were collected.';
            } else if (collectResult.opened?.title) {
              summary = `Collected ${collectResult.added ?? 0} media files and opened ${collectResult.opened.title}.`;
            } else {
              summary = `Collected ${collectResult.added ?? 0} media files into the app.`;
            }
          }

          setChatLines(prev => [...prev, { id: `tool-${toolCall.id}`, role: 'tool', content: summary }]);

          workingConversation = [
            ...workingConversation,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            },
          ];
        }

        // After all tools for this step, if we found documents, show them
        if (foundDocuments.length > 0) {
          setChatLines(prev => [...prev, {
            id: `media-${Date.now()}`,
            role: 'assistant',
            content: 'I found these relevant items:',
            metadata: { documents: foundDocuments.slice(0, 6) }
          }]);
        }
      }

      setChatLines(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'The request needed too many tool steps. Try asking in a more specific way.',
      }]);
      setConversation(workingConversation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The Puter agent failed to run.';
      setChatLines(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: message,
      }]);
    } finally {
      setIsRunning(false);
    }
  }, [conversation, executeToolCall, isRunning, query, toolDefinitions]);

  const sidebarTogglingHandler = useCallback(() => {
    setShowSideBar(prev => !prev);
  }, []);

  const MediaResultCard = ({ doc }: { doc: BackendMediaDocument }) => {
    return (
      <div
        onClick={() => {
          requestMediaFocus(doc.type, doc.id, doc.type !== 'image');
          navigate(routeForMedia(doc.type));
        }}
        className="group relative flex flex-col gap-2 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/30 transition-all cursor-pointer overflow-hidden"
      >
        <div className="aspect-video relative rounded-lg overflow-hidden bg-black/40">
          <div className="absolute inset-0 flex items-center justify-center">
            {doc.type === 'audio' ? <span className="text-2xl text-cyan-400/50">🎵</span> :
              doc.type === 'video' ? <span className="text-2xl text-blue-400/50">🎥</span> :
                <span className="text-2xl text-emerald-400/50">🖼️</span>}
          </div>
          {/* Real images would go here if available, using the type icon as a premium placeholder */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/80 to-transparent pt-4 px-2">
            <p className="text-[10px] text-white/50 uppercase tracking-wider truncate">{doc.sourceLabel}</p>
          </div>
        </div>
        <div className="px-1">
          <p className="text-xs font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
            {doc.title || doc.fileName}
          </p>
          <p className="text-[10px] text-white/40 truncate">
            {doc.artist || (doc.size ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB` : 'Cloud Stream')}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] grid grid-cols-[minmax(320px,380px)_1fr] gap-6 max-sm:max-w-full max-sm:flex justify-center items-center max-sm:rounded-md max-sm:h-[96vh] max-sm:overflow-hidden max-sm:*:border-0">
      <button type="button" className='agent-mono-button hidden absolute top-0 left-0 my-2 mx-2 p-2 overflow-hidden rounded-md max-sm:block' onClick={sidebarTogglingHandler}>
        {!showSideBar ? <RiMenuFill /> : <CgCloseR />}
      </button>
      <section className={`${glassPanelClass} p-5 space-y-5 max-h-[calc(100vh-6rem)] overflow-y-scroll max-sm:rounded-md ${showSideBar ? "max-sm:block" : "max-sm:hidden"}`}>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Your Agent Space</p>
          <h1 className="text-3xl font-semibold text-white">Media Intelligence Center</h1>
          <p className="text-sm text-white/60">
            Let the agent help or yourself scan your device media you want to play directly here without any manual search effort.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <p className="text-xs text-white/45">Audio</p>
            <p className="text-2xl font-semibold">{localCounts.audio}</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <p className="text-xs text-white/45">Video</p>
            <p className="text-2xl font-semibold">{localCounts.video}</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <p className="text-xs text-white/45">Images</p>
            <p className="text-2xl font-semibold">{localCounts.image}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Browser Folder Sync</p>
              <p className="text-xs text-white/55">{syncState.message}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => {
                  void (async () => {
                    try {
                      await rescanDirectorySources();
                      await refreshBackendIndexStats();
                    } catch {
                      // Sync state already captures the failure.
                    }
                  })();
                }}
                className="agent-mono-button inline-flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
              >
                <FaArrowRotateRight className="text-sm" />
                <span className="text-sm">Rescan</span>
              </button>
              <button
                onClick={() => {
                  void (async () => {
                    try {
                      await connectSuggestedDirectorySources();
                      await refreshBackendIndexStats();
                    } catch {
                      // Sync state already captures the failure.
                    }
                  })();
                }}
                disabled={!supportsDirectorySync}
                className="agent-mono-button inline-flex items-center gap-2 px-3 py-2 rounded-xl disabled:opacity-60 transition-colors"
              >
                <FaFolderOpen className="text-sm" />
                <span className="text-sm">Add Common</span>
              </button>
              <button
                onClick={() => {
                  void (async () => {
                    try {
                      await connectCustomDirectorySource();
                      await refreshBackendIndexStats();
                    } catch {
                      // Sync state already captures the failure.
                    }
                  })();
                }}
                disabled={!supportsDirectorySync}
                className="agent-mono-button inline-flex items-center gap-2 px-3 py-2 rounded-xl disabled:opacity-60 transition-colors"
              >
                <FaFolderOpen className="text-sm" />
                <span className="text-sm">Add Custom</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-white/50">
            This section is optional. Use it only for browser-managed folder handles. Direct Device access is handled by the Device Scan above.
          </p>

          {!supportsDirectorySync && (
            <p className="text-xs text-amber-200/80">
              Automatic folder sync requires a Chromium browser that supports the File System Access API.
            </p>
          )}

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {syncedSources.length === 0 ? (
              <p className="text-sm text-white/45">No synced folders yet.</p>
            ) : (
              syncedSources.map(source => (
                <div key={source.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{source.label}</p>
                    <p className="text-xs text-white/55">
                      {source.itemCount} items | {source.status.replace('-', ' ')}
                    </p>
                    {source.error && (
                      <p className="text-xs text-rose-200/80 mt-1">{source.error}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      void (async () => {
                        try {
                          await removeMediaSource(source.id);
                        } finally {
                          await refreshBackendIndexStats();
                        }
                      })();
                    }}
                    className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-red-500/20 transition-colors"
                    title="Remove source"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Device Media Sync</p>
          <p className="text-xs text-white/55 mt-1">
            {backendStats
              ? `${backendStats.total} indexed items across ${backendStats.sources} sources`
              : 'no media found yet.'}
          </p>
        </div>
      </section>

      <section className={`${glassPanelClass} p-5 flex flex-col h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] overflow-hidden max-sm:max-h-[84vh] max-sm:p-0 max-sm:-mt-4 max-sm:rounded-md max-sm:overflow-y-scroll ${showSideBar ? "max-sm:hidden" : "max-sm:block"}`}>
        <div className="mb-4 max-sm:m-2">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40 max-sm:hidden">Conversation</p>
          <h2 className="text-2xl font-semibold text-white mt-2 max-sm:mt-0 max-sm:text-sm">Ask the agent</h2>
        </div>

        <div
          ref={chatScrollRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-2 max-sm:pr-0 max-sm:min-h-[82%]"
        >
          {chatLines.map(line => (
            <div
              key={line.id}
              className={`max-w-[82%] rounded-3xl px-5 py-4 text-sm leading-6 max-sm:text-xs max-sm:leading-4 max-sm:rounded-xl max-sm:p-3 animate-message ${line.role === 'user'
                ? 'ml-auto bg-cyan-400/20 border border-cyan-400/30 text-white'
                : line.role === 'tool'
                  ? 'bg-white/5 border border-white/5 text-white/50 text-[11px] italic'
                  : line.role === 'typing'
                    ? 'bg-white/10 border border-white/10 text-white min-w-[60px]'
                    : 'bg-white/10 border border-white/10 text-white'
                } wrap-break-word whitespace-pre-wrap`}
            >
              {line.role === 'typing' ? (
                <div className="flex gap-1 items-center h-4">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              ) : (
                <>
                  {line.content}
                  {line.metadata?.documents && line.metadata.documents.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {line.metadata.documents.map(doc => (
                        <MediaResultCard key={doc.id} doc={doc} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {isRunning && chatLines[chatLines.length - 1]?.role !== 'typing' && (
            <div className="max-w-[80px] rounded-3xl px-5 py-4 bg-white/10 border border-white/10 animate-message">
              <div className="flex gap-1 items-center h-4">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendPromptToAgent();
          }}
          className="mt-4 flex shrink-0 gap-3 max-sm:sticky bottom-0 max-sm:min-w-ful max-sm:min-h-[10%] max-sm:bottom-0 max-sm:gap-x-0"
        >
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find and collect my gospel songs, open the wedding album, or refresh the library."
            className="flex-1 resize-none min-h-24 rounded-2xl bg-white border border-white/10 px-4 py-3 text-sm text-black outline-none focus:border-cyan-300/50 max-sm:rounded-md max-sm:min-h-full max-sm:text-xs max-sm:min-w-[80%]"
          />
          <button
            type="submit"
            disabled={isRunning || !query.trim()}
            className="agent-mono-submit px-5 rounded-2xl font-semibold disabled:opacity-60 max-sm:scale-80 max-sm:rounded-xlg"
          >
            {isRunning ? <VscLoading className='animate-spin' /> : <BiSolidSend className='m-auto' />}
          </button>
        </form>
      </section>
    </div>
  );
};
