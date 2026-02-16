import React, { createContext, useContext, useState } from "react";
import AudiosMocks from "../DataSource/AudioStorage.json";
import type { ICurrentAudiosPlayState } from "../Interfaces/ICurrentAudiosPlayState";
import type { CurrentAudiosPlayObj } from "../Interfaces/CurrentAudiosPlayObj";

const CurrentAudiosPlayContext = createContext<ICurrentAudiosPlayState | undefined>(undefined);

export const CurrentAudiosPlayContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentAudioItems, setCurrentAudioItems] = useState<CurrentAudiosPlayObj>({currentAudioItems: [AudiosMocks[0],AudiosMocks[1], AudiosMocks[2]]});
  return (
    <CurrentAudiosPlayContext.Provider value={{ currentAudioItems, setCurrentAudioItems }}>
      {children}
    </CurrentAudiosPlayContext.Provider>
  );
};

export const useCurrentAudiosPlay = () => {
  const context = useContext(CurrentAudiosPlayContext);
  if (!context) {
    throw new Error("CurrentAudiosPlayContext must be used within an CurrentAudiosPlayContextProvider");
  }
  return context;
};