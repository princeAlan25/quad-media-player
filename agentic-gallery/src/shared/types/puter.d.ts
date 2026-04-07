export interface PuterToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface PuterToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface PuterChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  tool_calls?: PuterToolCall[];
  tool_call_id?: string;
}

export interface PuterChatResponse {
  message?: PuterChatMessage;
  text?: string;
}

export interface PuterGlobal {
  ai: {
    chat: (prompt: string | PuterChatMessage[], options?: Record<string, unknown>) => Promise<string | PuterChatResponse>;
  };
  auth: {
    isSignedIn?: () => boolean;
    signIn: (options?: Record<string, unknown>) => Promise<unknown>;
  };
}

declare global {
  interface Window {
    puter?: PuterGlobal;
  }
}

export {};
