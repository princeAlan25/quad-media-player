import type { AudioItem } from "../Interfaces/AudioItem";


export class AudioBroker {
    async getAgentAudio(audioPlayerElement: String, promptInputElement: String) {
        const promptInput: HTMLTextAreaElement = document.getElementById(`${promptInputElement}`) as HTMLTextAreaElement;
        const audioRequest = { message: promptInput.value }
        try {
            const audioResponse = await fetch("http://localhost:3000/api/audio/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(audioRequest)
            });
            const audioItemData: AudioItem = await audioResponse.json();
            this.playAudio(audioPlayerElement, audioItemData, audioItemData.url);
        }
        catch (error) {
            alert("Error" + error);
        }
    }

    playAudio(audioPlayerElement: String, audioItem: AudioItem, screenAudioElementID?: string) {
        if (screenAudioElementID) {
            const audioElement: HTMLAudioElement = document.getElementById(`${audioPlayerElement}`) as HTMLAudioElement;
            audioElement.src = audioItem.url;
            audioElement.play();
            const screenAudioElement: HTMLParagraphElement = document.getElementById(screenAudioElementID) as HTMLParagraphElement
            screenAudioElement.click();
        }
    }

    setScreenAudioPlayState(audioUrl: string, allScreenStateAudios: AudioItem[]): AudioItem[] {
        const updatedScreenAudiosState: AudioItem[] = allScreenStateAudios.map(audioItem => {
            if (audioItem.url == audioUrl) {
                audioItem.isPlaying = true;
                this.playAudio("audioElement", audioItem);
                return audioItem
            }
            audioItem.isPlaying = false;
            return audioItem;
        });
        return updatedScreenAudiosState;
    }

}