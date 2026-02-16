import type { AudioItem } from "../../Interfaces/AudioItem"
import { useAudioSync } from "../../Shared/AudioSyncContextProvider"
import { TrashAudioItem } from "./TrashAudioItem";

export const TrashAudiosList = () => {
    const { audioSyncState, setAudioSyncState } = useAudioSync();

    //remove the audio from mp3 player trash
    function RemoveAudioItem(audioItem: AudioItem) {
        setAudioSyncState({ screenAudioItems: audioSyncState?.screenAudioItems as AudioItem[], trashAudioItems: audioSyncState?.trashAudioItems.filter(item => item != audioItem) as AudioItem[] });
    }
    function RestoreAudioItem(audioItem: AudioItem)
    {
        setAudioSyncState({screenAudioItems: audioSyncState?.screenAudioItems.push(audioItem) as unknown as AudioItem[], trashAudioItems: audioSyncState?.trashAudioItems as AudioItem[]});
        RemoveAudioItem(audioItem);
    }

    return (
        <div className="overflow-hidden overflow-y-scroll h-[90%] scroll-smooth">
            {
                (audioSyncState?.trashAudioItems as AudioItem[]).map<React.ReactNode>(audioItem => {
                    return <TrashAudioItem audioItem={audioItem} audioRemoverHandler={RemoveAudioItem} audioRestoreHandler={RestoreAudioItem} key={audioItem.id} />
                })
            }
        </div>
    )
}