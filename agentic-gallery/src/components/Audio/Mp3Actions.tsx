import { useEffect, useState } from 'react';
import { AudioBroker } from '../../Brokers/AudioBroker';
import {
    FaPlay,
    FaForwardStep,
    FaBackwardStep,
    FaRepeat,
    FaShuffle,
    FaPause,
} from 'react-icons/fa6';
import { MdRepeatOne } from 'react-icons/md';
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
    const [audioIndex, setAudioIndex] = useState<number>(0);
    const [repeatSong, setRepeatSong] = useState(0);

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

    function playNexAudio(currentAudioIndex: number) {
        const newAudioIndex: number = audioBroker.playNextAudio(audioSyncState?.screenAudioItems as AudioItem[], currentAudioIndex);
        setAudioIndex(newAudioIndex);
        setAudioSyncState({ screenAudioItems: audioSyncState?.screenAudioItems as AudioItem[], trashAudioItems: audioSyncState?.trashAudioItems as AudioItem[], repeatSongs: audioSyncState?.repeatSongs, shuffle: audioSyncState?.shuffle })
    }

    function playPrevAudio(currentAudioIndex: number) {
        const newAudioIndex: number = audioBroker.playPreviousAudio(audioSyncState?.screenAudioItems as AudioItem[], currentAudioIndex);
        setAudioIndex(newAudioIndex);
        setAudioSyncState({ screenAudioItems: audioSyncState?.screenAudioItems as AudioItem[], trashAudioItems: audioSyncState?.trashAudioItems as AudioItem[], repeatSongs: audioSyncState?.repeatSongs, shuffle: audioSyncState?.shuffle })
    }

    function repeatSongs() {
        if (repeatSong > 1) {
            setRepeatSong(0);
        }
        else {
            setRepeatSong(prevState => prevState + 1);
        }
        setAudioSyncState({ screenAudioItems: audioSyncState?.screenAudioItems as AudioItem[], trashAudioItems: audioSyncState?.trashAudioItems as AudioItem[], repeatSongs: repeatSong, shuffle: audioSyncState?.shuffle });
    }

    useEffect(() => {
        setAudioIndex(getCurrentAudioIndex());
        if (repeatSong != 0) {
            const repeatedAudioIndex: number = audioBroker.playSongRepeatedly(audioSyncState?.screenAudioItems as AudioItem[], repeatSong, getCurrentAudioIndex());
            setAudioIndex(repeatedAudioIndex);
        }
    }, [audioSyncState, audioIndex, repeatSong])

    return (
        <div className="w-[60%] h-[80%] rounded-lg shadow-md mt-10 flex flex-col justify-evenly bg-linear-to-r from-transparent via-white/40 to-transparent *:w-full *:h-[25%] [&_button]:active:scale-95 [&_button]:cursor-pointer [&_button]:hover:bg-black/10">
            <div className="flex justify-center">
                <button title="Repeat" className={repeatSong > 0 ? "p-5 rounded-full text-green-200 shadow-md shadow-green-200" : "p-5 rounded-full shadow text-black"} onClick={repeatSongs}>{repeatSong > 1 ? <MdRepeatOne /> : <FaRepeat />}</button>
            </div>
            <div className="flex justify-evenly">
                <button title="Previous" className='text-black p-5 rounded-full shadow' onClick={() => playPrevAudio(getCurrentAudioIndex())}><FaBackwardStep /></button>
                <button title="Play" className='text-black p-5 rounded-full shadow' onClick={changePlayBtnState}>{(audioSyncState?.screenAudioItems.some(audioItem => audioItem.isPlaying)) || playAudioBtnState ? <FaPause /> : <FaPlay />}</button>
                <button title="Next" className='text-black p-5 rounded-full shadow' onClick={() => playNexAudio(getCurrentAudioIndex())}><FaForwardStep /></button>
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
