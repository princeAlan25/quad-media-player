import { LLM_VS_UserChat } from "./LLM_VS_UserChat"
import { Mp3Trash } from "./Mp3Trash"

export const AITaskResultSpace = () => {
    return (
        <div className="w-full h-[84%] rounded-4xl bg-white/20 overflow-hidden">
            <LLM_VS_UserChat />
            <Mp3Trash />
        </div>
    )
}