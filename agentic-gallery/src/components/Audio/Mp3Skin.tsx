import { Mp3Player } from "./Mp3Player"

export const Mp3Skin = () => {
    return (
        <div className="w-[40%] h-full p-5 bg-white/40 rounded-4xl flex flex-col justify-between shadow-lg shadow-white/10 backdrop-blur-3xl">
            <Mp3Player />
        </div>
    )
}

