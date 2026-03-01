import type { AudioItem } from "../../Interfaces/AudioItem"
import { useAudioSync } from "../../Shared/AudioSyncContextProvider"
import { Mp3ScreenAudioItem } from "./Mp3ScreenAudioItem";


export const Mp3ScreenAudiosList = () => {
    const { audioSyncState, setAudioSyncState } = useAudioSync();

    //remove the audio from mp3 player screen
    function RemoveAudioSync(audioItem: AudioItem) {
        setAudioSyncState({ screenAudioItems: audioSyncState?.screenAudioItems.filter(item => item != audioItem) as AudioItem[], trashAudioItems: audioSyncState?.trashAudioItems.concat(...audioSyncState?.screenAudioItems.filter(item => item.id == audioItem.id) as AudioItem[]) as AudioItem[], repeatSongs: audioSyncState?.repeatSongs , shuffle: audioSyncState?.shuffle});
    }

    return (
        <div className="overflow-hidden overflow-y-scroll h-[90%] scroll-smooth">
                {
                    (audioSyncState?.screenAudioItems as AudioItem[]).map<React.ReactNode>(audioItem => {
                        return (
                            <Mp3ScreenAudioItem audioItem={audioItem} audioRemoverHandler={RemoveAudioSync} key={audioItem.id} currentAudioPlayStyle={audioItem.isPlaying ? "bg-green-600" : "bg-linear-to-r from-white/30 via-white to-white/30"} />
                        )
                    })
                }
        </div>
    )
}