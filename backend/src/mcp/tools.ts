import { IAudioItem } from "../Interfaces/IAudioItem";

export const AudioTools = {
  provide_audio: async ({ id, title, artist, url }: IAudioItem, audioSearchSource: IAudioItem[]): Promise<IAudioItem> => {
    const audioItem: IAudioItem = audioSearchSource.find(item => item.title == title || item.url == url || item.id == id) as unknown as IAudioItem;
    return audioItem;
  },

  get_all_audios: async (allAudiosSource: IAudioItem[]) => allAudiosSource
};
