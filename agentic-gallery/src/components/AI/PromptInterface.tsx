import { AudioBroker } from "../../Brokers/AudioBroker";

export const PromptInterface = () => {
    const audioBroker = new AudioBroker();
    return (
        <div className="w-full h-fit max-h-fit bg-white/50 rounded-4xl grid-cols-2 gap-5 p-5">
            <textarea className="w-[86%] h-full text-black outline-none bg-black/5 p-2 rounded-lg overflow-hidden wrap-break-word" id="promptInputElement" placeholder="Let me user your mp3 Player!"></textarea>
            <button className="p-5 min-h-18 max-h-18 float-right rounded-full shadow-md text-green-700 font-bold bg-white hover:opacity-50 cursor-pointer active:opacity-100" onClick={() => audioBroker.getAgentAudio("audioElement", "promptInputElement")}>Send</button>
        </div>
    )
}