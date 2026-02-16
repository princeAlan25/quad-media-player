import { FaRecycle, FaTrash } from "react-icons/fa6"
import type { AudioItem } from "../../Interfaces/AudioItem"

export const TrashAudioItem = ({ audioItem, audioRemoverHandler, audioRestoreHandler }: { audioItem: AudioItem, audioRemoverHandler: (audioItm: AudioItem) => void, audioRestoreHandler: (audioItm: AudioItem) => void }) => {
    return (
        <div className="w-full flex justify-between items-center active:bg-white/0 border-b border-white/10" key={audioItem.url}>
            <div className="w-[80%] hover:bg-white/20 p-2 cursor-pointer">
                <p>{audioItem.title}</p>
            </div>
            <div className="w-[18%] flex justify-evenly p-2 *:cursor-pointer">
                <button className="w-5 h-5 p-1 flex justify-center items-center hover:*:opacity-50 *:active:opacity-100" onClick={() => audioRemoverHandler(audioItem)}><FaTrash /></button>
                <button className="w-5 h-5 p-1 flex justify-center items-center hover:*:opacity-50 *:active:opacity-100" onClick={() => audioRestoreHandler(audioItem)}><FaRecycle /></button>
            </div>
        </div>
    )
}