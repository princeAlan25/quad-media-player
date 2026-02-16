import type { CurrentAudiosPlayObj } from "./CurrentAudiosPlayObj";

export interface ICurrentAudiosPlayState {
    currentAudioItems: CurrentAudiosPlayObj,
    setCurrentAudioItems: (currentAudiosState: CurrentAudiosPlayObj) => CurrentAudiosPlayObj[] | void
}