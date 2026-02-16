import { PromptInterface } from "../components/AI/PromptInterface"
import { AITaskResultSpace } from "../components/Audio/AITaskResultSpace"
import { Mp3Skin } from "../components/Audio/Mp3Skin"
import { AudioSyncProvider } from "../Shared/AudioSyncContextProvider"

export const AudioPage = () => {
    return (
        <div className="w-full h-full flex justify-between">
            <AudioSyncProvider>
                <Mp3Skin />
                <div className="w-[58%] bg-white/10 rounded-4xl p-2 flex flex-col justify-between">
                    <PromptInterface />
                    <AITaskResultSpace />
                </div>
            </AudioSyncProvider>

        </div>
    )
}