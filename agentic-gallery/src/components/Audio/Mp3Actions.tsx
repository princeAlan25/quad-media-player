import {
    FaPlay,
    FaForwardStep,
    FaBackwardStep,
    FaRepeat,
    FaShuffle
} from 'react-icons/fa6';

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
    return (
        <div className="w-[60%] h-[80%] rounded-lg shadow-md mt-10 flex flex-col justify-evenly bg-linear-to-r from-transparent via-white/40 to-transparent *:w-full *:h-[25%] [&_button]:active:scale-95 [&_button]:cursor-pointer [&_button]:hover:bg-black/10">
            <div className="flex justify-center">
                <button title="Repeat" className='text-black p-5 rounded-full shadow'><FaRepeat /></button>
            </div>
            <div className="flex justify-evenly">
                <button title="Previous" className='text-black p-5 rounded-full shadow'><FaBackwardStep /></button>
                <button title="Play" className='text-black p-5 rounded-full shadow'><FaPlay /></button>
                <button title="Next" className='text-black p-5 rounded-full shadow'><FaForwardStep /></button>
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
