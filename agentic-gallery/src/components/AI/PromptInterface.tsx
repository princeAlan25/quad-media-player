import { FaPaperPlane } from "react-icons/fa6";
import { AudioBroker } from "../../Brokers/AudioBroker";

export const PromptInterface = () => {
    const audioBroker = new AudioBroker();
    return (
        <div className="w-full h-fit max-h-fit bg-white/50 rounded-4xl grid-cols-2 gap-5 p-5">
            <textarea className="w-[85%] h-full text-black outline-none bg-black/5 p-2 rounded-lg overflow-hidden wrap-break-word" id="promptInputElement" placeholder="Let me use your mp3 Player to listen together!" required></textarea>
            <button className="p-5 min-w-16 max-w-16 min-h-16 max-h-16 mr-2 float-right rounded-full shadow-md text-green-700 font-bold bg-white hover:opacity-50 cursor-pointer active:opacity-100" onClick={async () => await audioBroker.getAgentAudio("audioElement", "promptInputElement")}><FaPaperPlane className="w-full h-full" /></button>
        </div>
    )
}