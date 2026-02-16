import type { IAudioSyncItem } from "./IAudioSyncItem"

export interface IAudioSyncState
{
    audioSyncState: IAudioSyncItem | undefined
    setAudioSyncState: (audioItemState: IAudioSyncItem ) => IAudioSyncItem | void
}