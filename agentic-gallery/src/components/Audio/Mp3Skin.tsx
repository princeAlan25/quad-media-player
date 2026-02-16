import { CurrentAudiosPlayContextProvider } from "../../Shared/CurrentAudiosPlayContextProvider"
import { Mp3Actions } from "./Mp3Actions"
import { Mp3Screen } from "./Mp3Screen"
import { Mp3Speaker } from "./Mp3Speaker"

export const Mp3Skin = () => {
    return (
        <div className="w-[40%] h-full p-5 bg-white/40 rounded-4xl flex flex-col justify-between shadow-lg shadow-white/10 backdrop-blur-3xl">
            <CurrentAudiosPlayContextProvider>
                <Mp3Screen />
                <Mp3Actions />
                <Mp3Speaker />
            </CurrentAudiosPlayContextProvider>
        </div>
    )
}