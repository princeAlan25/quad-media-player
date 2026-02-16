import type { AudioItem } from "./AudioItem";

export interface IAudioSyncItem {
    screenAudioItems: AudioItem[],
    trashAudioItems: AudioItem[]
}