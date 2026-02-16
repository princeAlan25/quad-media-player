import { useEffect, useState } from 'react';
import { AudioBroker } from '../../Brokers/AudioBroker';
import {
    FaPlay,
    FaForwardStep,
    FaBackwardStep,
    FaRepeat,
    FaShuffle,
    FaPause
} from 'react-icons/fa6';
import { useAudioSync } from '../../Shared/AudioSyncContextProvider';
import type { AudioItem } from '../../Interfaces/AudioItem';


const audioBroker: AudioBroker = new AudioBroker();

const Slider = () => {
    return (
        <div className="w-full h-[10%] bg-linear-to-b from-white/40 via-transparent to-white/40 rounded-xl flex items-center overflow-hidden">
            {/* <div className="w-8 h-8 rounded-full bg-radial-[at_40%_25%] from-white to-transparent to-80% rounded-full cursor-pointer active:scale-90"></div> */}
            <audio controls className="w-full" id='audioElement'>
                <source src="none" type="audio/mp3" />
            </audio>
        </div>
    )
}

const ActionButtons = () => {
    const [playAudioBtnState, setPlayAudioBtnState] = useState(false);
    const { audioSyncState, setAudioSyncState } = useAudioSync();
    const [audioIndex, setAudioIndex] = useState<number>(getCurrentAudioIndex);

    function getCurrentAudioIndex(): number {
        const currentIndex: number = (audioSyncState?.screenAudioItems.findIndex((audioItem, index) => {
            if (audioItem.isPlaying) {
                return index;
            }
        })) as number;
        return currentIndex;
    }

    function changePlayBtnState() {
        setPlayAudioBtnState(prevPlayState => !prevPlayState);
    }

    function playNextAudio(currentAudioIndex: number) {
        const newAudioIndex: number = audioBroker.playNextAudio(audioSyncState?.screenAudioItems as AudioItem[], currentAudioIndex);
        setAudioIndex(newAudioIndex);
        setAudioSyncState({ screenAudioItems: audioSyncState?.screenAudioItems as AudioItem[], trashAudioItems: audioSyncState?.trashAudioItems as AudioItem[] })
    }

    function playPrevAudio(currentAudioIndex: number) {
        const newAudioIndex: number = audioBroker.playPreviousAudio(audioSyncState?.screenAudioItems as AudioItem[], currentAudioIndex);
        setAudioIndex(newAudioIndex);
        setAudioSyncState({ screenAudioItems: audioSyncState?.screenAudioItems as AudioItem[], trashAudioItems: audioSyncState?.trashAudioItems as AudioItem[] })
    }

    useEffect(() => {
        setAudioIndex(getCurrentAudioIndex());
    }, [audioSyncState, audioIndex])

    return (
        <div className="w-[60%] h-[80%] rounded-lg shadow-md mt-10 flex flex-col justify-evenly bg-linear-to-r from-transparent via-white/40 to-transparent *:w-full *:h-[25%] [&_button]:active:scale-95 [&_button]:cursor-pointer [&_button]:hover:bg-black/10">
            <div className="flex justify-center">
                <button title="Repeat" className='text-black p-5 rounded-full shadow'><FaRepeat /></button>
            </div>
            <div className="flex justify-evenly">
                <button title="Previous" className='text-black p-5 rounded-full shadow' onClick={() => playPrevAudio(audioIndex)}><FaBackwardStep /></button>
                <button title="Play" className='text-black p-5 rounded-full shadow' onClick={changePlayBtnState}>{(audioSyncState?.screenAudioItems.some(audioItem => audioItem.isPlaying)) || playAudioBtnState ? <FaPause /> : <FaPlay />}</button>
                <button title="Next" className='text-black p-5 rounded-full shadow' onClick={() => playNextAudio(audioIndex)}><FaForwardStep /></button>
            </div>
            <div className="flex justify-center">
                <button title="Shuffle" className='text-black p-5 rounded-full shadow'><FaShuffle /></button>
            </div>
        </div>
    )
}

export const Mp3Actions = () => {
    return (
        <div className="w-full h-[40%] flex flex-col items-center">
            <Slider />
            <ActionButtons />
        </div>
    )
}
