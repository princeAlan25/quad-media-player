import { Mp3Actions } from "./Mp3Actions"
import { Mp3Screen } from "./Mp3Screen"
import { Mp3Speaker } from "./Mp3Speaker"

export const Mp3Skin = () => {
    return(
        <div className="w-[50%] h-full p-5 rounded-[50px] flex flex-col justify-between shadow-lg shadow-white/10 backdrop-blur-3xl">
            <Mp3Screen />
            <Mp3Actions />
            <Mp3Speaker />
        </div>
    )   
}