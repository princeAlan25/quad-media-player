import type { AudioItem } from "./AudioItem";

export interface LLMAudioPlayResponse
{
    audioItem: AudioItem,
    assistantMessage: String
}