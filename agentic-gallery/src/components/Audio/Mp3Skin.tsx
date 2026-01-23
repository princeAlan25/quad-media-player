import { Mp3Actions } from "./Mp3Actions"
import { Mp3Screen } from "./Mp3Screen"
import { Mp3Speaker } from "./Mp3Speaker"

export const Mp3Skin = () => {
    return(
        <div className="w-[50%] h-[100%] p-5 bg-radial-[at_50%_50%] from-white/20 to-white to-90% rounded-md flex flex-col justify-between shadow-lg shadow-white/10 backdrop-blur-3xl">
            <Mp3Screen />
            <Mp3Actions />
            <Mp3Speaker />
        </div>
    )   
}