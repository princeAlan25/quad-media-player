import { FaTrash } from "react-icons/fa6"

export const Mp3Screen = () => {
    return (
        <div className="w-full h-[40%] p-2 bg-linear-to-r from-transparent via-white/40 to-transparent rounded-md">
            <div className="w-full h-full p-5 flex justify-center">
                <div className="w-full p-1 flex justify-center">
                    <div className="w-[80%]">
                        <div className="hover:bg-green-300/10 active:bg-green-300/30 border-b border-white/20 flex justify-between items-center">
                            <p className="hover:bg-green-300 cursor-pointer bg-linear-to-r from-white/20 via-white to-white/20 bg-clip-text text-md font-extrabold text-transparent text-center">
                                eirsgoiegsoei weorigwoerifwerf.mp3
                            </p>
                            <button className="w-5 h-5 p-1 flex justify-center items-center cursor-pointer hover:*:opacity-50 active:*:opacity-100"><FaTrash /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}