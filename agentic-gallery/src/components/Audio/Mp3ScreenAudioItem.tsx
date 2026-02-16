import { FaTrash } from "react-icons/fa6"
import type { AudioItem } from "../../Interfaces/AudioItem"
import { AudioBroker } from "../../Brokers/AudioBroker"
import { useAudioSync } from "../../Shared/AudioSyncContextProvider";
import { useEffect, useState } from "react";

const audioBroker: AudioBroker = new AudioBroker();

export const Mp3ScreenAudioItem = ({ audioItem, audioRemoverHandler, currentAudioPlayStyle }: { audioItem: AudioItem, audioRemoverHandler: (audioItm: AudioItem) => void, currentAudioPlayStyle: string }) => {
    const { audioSyncState, setAudioSyncState } = useAudioSync();
    const [audioUrl, setAudioUrl] = useState("");
    const [audioItemClicked, setAudioItemClicked] = useState(false);

    useEffect(() => {
        const updatedAudiosState: AudioItem[] = audioBroker.setScreenAudioPlayState(audioUrl, audioSyncState?.screenAudioItems as unknown as AudioItem[]);
        setAudioSyncState({ screenAudioItems: updatedAudiosState as AudioItem[], trashAudioItems: audioSyncState?.trashAudioItems as AudioItem[] })
    }, [audioItemClicked])

    return (
        <div className="border-b border-white/20 flex justify-between items-center my-1 scroll-smooth">
            <p className={`hover:bg-green-300 active:bg-green-600 max-w-[80%] cursor-pointer ${currentAudioPlayStyle} bg-clip-text text-md font-extrabold text-transparent scale-90`} id={`${audioItem.url}`} onClick={(e) => { setAudioUrl(e.currentTarget.id); setAudioItemClicked(preClickState => !preClickState) }}>{audioItem.title}</p>
            <button className="w-5 h-5 p-1 flex justify-center items-center cursor-pointer hover:*:opacity-50 *:active:opacity-100" onClick={() => audioRemoverHandler(audioItem)}><FaTrash /></button>
        </div>
    )
}