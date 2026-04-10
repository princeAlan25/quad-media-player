import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRotateRight, FaFolderOpen, FaLink, FaTrash } from 'react-icons/fa6';
import type { AudioItem } from '@/shared/types/AudioItem';
import type { ImageItem } from '@/shared/types/ImageItem';
import type { VideoItem } from '@/shared/types/VideoItem';
import { fetchBackendHealth, fetchMediaDocument, fetchMediaDocuments, fetchMediaLibrary, fetchRagContext, getBackendMediaUrl, scanSystemMediaLibrary, searchMediaLibrary, searchJamendoMusic } from '@/shared/api/backendApi';
import { ensurePuterSignIn, getPuterModel, readPuterSessionSnapshot, refreshPuterSessionSnapshot, retryPuterSignIn, subscribeToPuterSessionUpdates } from '@/shared/lib/puterAuth';
import { useMediaLibrary } from '@/entities/media';
import type { BackendMediaDocument, BackendMediaMatch, BackendMediaStats, MediaKind } from '@/shared/types/LibraryMedia';
import type { PuterChatMessage, PuterChatResponse, PuterToolCall, PuterToolDefinition } from '@/shared/types/puter';
import { MdMenuBook, MdMoreVert } from 'react-icons/md';
import { RiMenu2Fill, RiMenuFill, RiMenuLine } from 'react-icons/ri';
import { FcCloseUpMode } from 'react-icons/fc';
import { BiCloset, BiSolidSend } from 'react-icons/bi';
import { CgCloseR } from 'react-icons/cg';
import { FiSend } from 'react-icons/fi';
import { BsFillSendFill } from 'react-icons/bs';
import { SiProgress } from 'react-icons/si';
import { FaTruckLoading } from 'react-icons/fa';
import { VscLoading } from 'react-icons/vsc';

type ChatRole = 'assistant' | 'user' | 'tool';

interface ChatLine {
  id: string;
  role: ChatRole;
  content: string;
}

const glassPanelClass = 'rounded-3xl border border-violet-500/35 bg-white/5 backdrop-blur-xl'

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
      content: 'Ask me to find media, collect many matching files into the app, open a result, or search with visual and OCR context from analyzed images and videos when available.',
    },
  ]);
  const [conversation, setConversation] = useState<PuterChatMessage[]>([
    {
      role: 'system',
      content: 'You are a media RAG assistant for a local media player. Search across the indexed PC media library, which may include AI-generated visual summaries, OCR text, and video scene tags for better retrieval. Use search_media to inspect results, use collect_media when the user wants many or all matching files loaded into the app, use open_media to focus one exact item, and never invent IDs or claim files exist unless a tool returns them. If the user asks for new music, songs, or artists, you must use search_jamendo_music to find and stream real music directly from the cloud. Be concise and practical.',
    },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSystemScanning, setIsSystemScanning] = useState(false);
  const [systemScanMessage, setSystemScanMessage] = useState('Scan folders on this Device directly so that the agent can search and open them without browser folder imports and also AI analysis classify audios, images and smaller videos for richer search.');
  const [puterSession, setPuterSession] = useState(() => readPuterSessionSnapshot());
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
  }, [chatLines]);

  useEffect(() => subscribeToPuterSessionUpdates(setPuterSession), []);

  useEffect(() => {
    refreshPuterSessionSnapshot();
  }, []);

  const startPuterConnection = useCallback(async () => {
    await retryPuterSignIn();
  }, []);

  const runBackendMediaScan = useCallback(async () => {
    setIsSystemScanning(true);
    try {
      const result = await scanSystemMediaLibrary();
      const skippedMessage = result.skippedEntries > 0
        ? ` Skipped ${result.skippedEntries} unreadable or protected entries.`
        : '';
      const analysisMessage = result.analysis
        ? result.analysis.analyzed > 0 || result.analysis.cached > 0
          ? ` Visual analysis enriched ${result.analysis.analyzed} new files and reused ${result.analysis.cached} cached results.`
          : result.analysis.enabled
            ? ' Visual analysis is enabled, but no eligible image or video files were enriched in this pass.'
            : ''
        : '';
      setSystemScanMessage(
        `Indexed ${result.scannedItems} media files from ${result.scannedSources} PC folders.${skippedMessage}${analysisMessage}`,
      );
      await refreshBackendIndexStats();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to scan this computer for media.';
      setSystemScanMessage(message);
      throw error;
    } finally {
      setIsSystemScanning(false);
    }
  }, [refreshBackendIndexStats]);

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

    const openableDocuments = uniqueDocuments.filter(document =>
      loadedIds.has(document.id) || document.sourceMode === 'system',
    );
    const documentsToAdd = openableDocuments.filter(document =>
      !loadedIds.has(document.id) && document.sourceMode === 'system',
    );

    const audioItems: AudioItem[] = [];
    const videoItems: VideoItem[] = [];
    const imageItems: ImageItem[] = [];

    for (const document of documentsToAdd) {
      const backendUrl = document.sourceId === 'jamendo' ? document.relativePath : getBackendMediaUrl(document.id);

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
        description: 'Rescan already-connected local directories and refresh the local index.',
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
  ]), []);

  const executeToolCall = useCallback(async (toolCall: PuterToolCall) => {
    const args = JSON.parse(toolCall.function.arguments || '{}') as Record<string, unknown>;

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
      if (document.sourceMode !== 'system') {
        return {
          ok: false,
          error: 'That media item is not currently loaded locally. Rescan your browser folders or scan the PC again.',
        };
      }

      const collection = addBackendDocumentsToLibrary([document], { openFirst: true });
      return {
        ...collection,
        route: routeForMedia(document.type),
        media: { id: document.id, title: document.title, type: document.type },
      };
    }

    if (toolCall.function.name === 'refresh_library') {
      const systemScan = await runBackendMediaScan();
      if (syncedSources.length > 0) {
        await rescanDirectorySources();
      }
      return {
        ok: true,
        syncedSources: syncedSources.length,
        systemScan,
      };
    }

    return { ok: false, error: `Unknown tool: ${toolCall.function.name}` };
  }, [addBackendDocumentsToLibrary, audios, images, localCounts, navigate, requestMediaFocus, rescanDirectorySources, runBackendMediaScan, syncedSources.length, videos]);

  const sendPromptToAgent = useCallback(async () => {
    const prompt = query.trim();
    if (!prompt || isRunning) {
      return;
    }

    setQuery('');
    setIsRunning(true);
    setChatLines(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: prompt }]);

    if (!window.puter) {
      setChatLines(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'Puter.js is unavailable in this session. Reload the page with internet access to use the agent.',
      }]);
      setIsRunning(false);
      return;
    }

    let workingConversation: PuterChatMessage[] = [
      ...conversation,
      { role: 'user', content: prompt },
    ];

    try {
      await ensurePuterSignIn();

      for (let step = 0; step < 10; step += 1) {
        const response = await window.puter.ai.chat(workingConversation, {
          model: getPuterModel(),
          tools: toolDefinitions,
          reasoning_effort: 'low',
          text: 'low',
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

        for (const toolCall of toolCalls) {
          const result = await executeToolCall(toolCall);
          let summary = `Ran ${toolCall.function.name}.`;

          if (toolCall.function.name === 'search_media') {
            summary = `Ran ${toolCall.function.name} and found ${((result as { matches?: BackendMediaMatch[] }).matches ?? []).length} matches.`;
          } else if (toolCall.function.name === 'search_jamendo_music') {
            summary = `Searched Jamendo music and loaded ${((result as any).added ?? 0)} new tracks into the app.`;
          } else if (toolCall.function.name === 'collect_media') {
            const collectResult = result as {
              matched?: number;
              added?: number;
              opened?: { title?: string } | null;
            };

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
    }, [showSideBar])

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] grid grid-cols-[minmax(320px,380px)_1fr] gap-6 max-sm:max-w-full max-sm:flex justify-center items-center max-sm:rounded-md max-sm:h-[96vh] max-sm:overflow-hidden max-sm:*:border-0">
      <button type="button" className='hidden absolute invert-75 bg-black/20 top-0 left-0 my-2 mx-2 p-2 overflow-hidden rounded-md max-sm:block' onClick={sidebarTogglingHandler}>
        {!showSideBar ? <RiMenuFill className='invert-100' /> : <CgCloseR className='invert-100' />}
      </button>
      <section className={`${glassPanelClass} p-5 space-y-5 max-h-[calc(100vh-6rem)] overflow-y-scroll max-sm:rounded-md ${showSideBar ? "max-sm:block" : "max-sm:hidden"}`}>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Your Agent Space</p>
          <h1 className="text-3xl font-semibold text-white">Media Control Room</h1>
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

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-4 space-y-3 hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Puter Agent</p>
              <p className="text-xs text-white/55">Puter sign-in is checked on load and requested only when needed from a user action.</p>
            </div>
            <button
              onClick={() => void startPuterConnection()}
              disabled={puterSession.phase === 'connecting' || puterSession.phase === 'ready'}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-400/20 hover:bg-cyan-400/30 disabled:opacity-60 transition-colors"
            >
              <FaLink className="text-sm" />
              <span className="text-sm">
                {puterSession.phase === 'connecting'
                  ? 'Connecting...'
                  : puterSession.phase === 'ready'
                    ? 'Connected'
                    : puterSession.phase === 'error'
                      ? 'Retry Login'
                      : 'Connect Puter'}
              </span>
            </button>
          </div>
          <p className="text-xs text-white/55">{puterSession.message}</p>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4 space-y-3">
          <div className="flex items-center justify-between max-sm:flex-col max-sm:space-y-2 max-sm:items-start">
            <div>
              <p className="text-sm font-medium text-white">Computer Scan</p>
              <p className="text-xs text-white/55">folders under your Windows/Linux/Mac,Mobile user profile directly, including subfolders, and can classify images, audios or smaller videos for better search when configured.</p>
            </div>
            <button
              onClick={() => void runBackendMediaScan()}
              disabled={isSystemScanning}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-60 transition-colors"
            >
              <FaFolderOpen className="text-sm" />
              <span className="text-sm">{isSystemScanning ? 'Scanning Device...' : 'Scan Device'}</span>
            </button>
          </div>
          <p className="text-xs text-white/55">{systemScanMessage}</p>
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
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
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
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 transition-colors"
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
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
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

      <section ref={chatScrollRef} className={`${glassPanelClass} p-5 flex flex-col h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] overflow-hidden max-sm:max-h-[84vh] max-sm:p-0 max-sm:-mt-4 max-sm:rounded-md max-sm:overflow-y-scroll ${showSideBar ? "max-sm:hidden" : "max-sm:block"}`}>
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
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 max-sm:text-xs max-sm:leading-4 max-sm:rounded-md max-sm:p-2 max-sm:border-none ${line.role === 'user'
                  ? 'ml-auto bg-cyan-400/20 border border-cyan-300/20 text-white max-sm:min-w-[84%]'
                  : line.role === 'tool'
                    ? 'bg-white/6 border border-white/8 text-white/70 max-sm:max-w-full'
                    : 'bg-white/10 border border-white/10 text-white max-sm:max-w-full'
                } wrap-break-word whitespace-pre-wrap`}
            >
              {line.content}
            </div>
          ))}
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
            className="flex-1 resize-none min-h-24 rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50 max-sm:rounded-md max-sm:min-h-full max-sm:text-xs max-sm:min-w-[80%] max-sm:bg-black invert-75"
          />
          <button
            type="submit"
            disabled={isRunning || !query.trim()}
            className="px-5 rounded-2xl bg-linear-to-br from-cyan-400 to-blue-500 text-slate-950 font-semibold disabled:opacity-50 max-sm:scale-80 max-sm:rounded-xlg"
          >
            {isRunning ? <VscLoading className='animate-spin' /> : <BiSolidSend className='m-auto' />}
          </button>
        </form>
      </section>
    </div>
  );
};
