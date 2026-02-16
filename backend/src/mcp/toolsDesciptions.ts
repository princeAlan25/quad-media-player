import { ToolDefinitionJson } from "@openrouter/sdk/esm/models";


export const audioToolsDescriptions: ToolDefinitionJson[] = [
  {
    type: "function",
    function: {
      name: "play_audio",
      description: "Play the current audio track"
    }
  },
  {
    type: "function",
    function: {
      name: "pause_audio",
      description: "Pause the currently playing audio"
    }
  },
  {
    type: "function",
    function: {
      name: "play_next",
      description: "Play the next audio track in the playlist"
    }
  },
  {
    type: "function",
    function: {
      name: "play_previous",
      description: "Play the previous audio track in the playlist"
    }
  },
  {
    type: "function",
    function: {
      name: "get_audio_state",
      description: "Get the current audio playback state"
    }
  }
];
