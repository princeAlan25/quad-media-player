import type { AudioItem } from "../Interfaces/AudioItem";
import AudioStorage from "../DataSource/AudioStorage.json";

export class AllAudioDataModel
{
    AllAudios() : AudioItem[]
    {
        return JSON.parse(AudioStorage.toString())
    }   
}