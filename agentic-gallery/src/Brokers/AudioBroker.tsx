import type { AudioItem } from "../Interfaces/AudioItem";
import type { CurrentAudiosPlayObj } from "../Interfaces/CurrentAudiosPlayObj";


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

    playAudio(audioPlayerElement: String, audioItem: AudioItem, screenAudioElementID?: string): CurrentAudiosPlayObj | void {
        if (screenAudioElementID) {
            const screenAudioElement: HTMLParagraphElement = document.getElementById(screenAudioElementID) as HTMLParagraphElement
            screenAudioElement.click();
        }
        const audioElement: HTMLAudioElement = document.getElementById(`${audioPlayerElement}`) as HTMLAudioElement;
        audioElement.src = audioItem.url;
        audioElement.play();
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

    playNextAudio(audiosSource: AudioItem[], currentAudioPlayIndex: number): number {
        let prevAudioIndex: number = currentAudioPlayIndex;
        let nextAudioIndex = prevAudioIndex + 1;
        // const currentPlayingAudio: AudioItem = audiosSource.find((audioItem, audioIndex) => {
        //     if (audioItem.isPlaying) {
        //         prevAudioIndex = audioIndex;
        //         return audioItem;
        //     }
        // }) as AudioItem;

        if (nextAudioIndex < audiosSource.length) {
            audiosSource = this.setScreenAudioPlayState(audiosSource[nextAudioIndex].url, audiosSource);
        }
        else {
            console.log("no more songs to play next!");
        }

        return nextAudioIndex;

    }

    playPreviousAudio(audiosSource: AudioItem[], currentAudioPlayIndex: number): number {
        let currentAudioIndex: number = currentAudioPlayIndex;
        let prevAudioIndex = currentAudioIndex > 0 ? currentAudioIndex - 1 : 0;
        // const currentPlayingAudio: AudioItem = audiosSource.find((audioItem, audioIndex) => {
        //     if (audioItem.isPlaying) {
        //         prevAudioIndex = audioIndex;
        //         return audioItem;
        //     }
        // }) as AudioItem;

        if (prevAudioIndex < audiosSource.length) {
            audiosSource = this.setScreenAudioPlayState(audiosSource[prevAudioIndex].url, audiosSource);
        }
        else {
            console.log("no more songs to play previously!");
        }

        return prevAudioIndex;

    }

}