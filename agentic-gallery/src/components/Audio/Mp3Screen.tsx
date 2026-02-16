import { Mp3ScreenAudiosList } from "./Mp3ScreenAudiosList"

export const Mp3Screen = () => {
    return (
        <div className="w-full h-[40%] p-2 bg-linear-to-r from-transparent via-white/40 to-transparent rounded-4xl shadow">
            <div className="w-full h-full p-5 flex justify-center">
                <div className="w-full flex justify-center">
                    <div className="w-[80%] overflow-x-hidden overflow-y-scroll px-2">
                        <Mp3ScreenAudiosList />
                    </div>
                </div>
            </div>
        </div>
    )
}