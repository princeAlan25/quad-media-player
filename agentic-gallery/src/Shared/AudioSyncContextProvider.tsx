import React, { createContext, useContext, useState } from "react";
import type { IAudioSyncState } from "../Interfaces/IAudioSyncState";
import AudiosMocks from "../DataSource/AudioStorage.json";
import type { IAudioSyncItem } from "../Interfaces/IAudioSyncItem";

const AudioSyncContext = createContext<IAudioSyncState | undefined>(undefined);

export const AudioSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const [audioSyncState, setAudioSyncState] = useState<IAudioSyncItem | undefined>({ screenAudioItems: AudiosMocks, trashAudioItems: [] });
  return (
    <AudioSyncContext.Provider value={{ audioSyncState, setAudioSyncState }}>
      {children}
    </AudioSyncContext.Provider>
  );
};

export const useAudioSync = () => {
  const context = useContext(AudioSyncContext);
  if (!context) {
    throw new Error("useAudioSync must be used within an AudioSyncProvider");
  }
  return context;
};