import { init } from '@heyputer/puter.js/src/init.cjs';

export class AiService {
  private readonly puter: any;

  constructor() {
    const token = process.env.PUTER_AUTH_TOKEN;
    if (!token) {
      console.warn('[AiService] PUTER_AUTH_TOKEN is not set in environment variables.');
    }
    // Initialize Puter SDK with the server-side token
    this.puter = init(token);
  }

  async chatCompletion(messages: any[], options: {
    model?: string;
    tools?: any[];
    reasoning_effort?: string;
  } = {}) {
    console.log(`[AiService] Sending request to Puter AI SDK (${options.model || 'default'})...`);

    try {
      const response = await this.puter.ai.chat(messages, {
        model: process.env.VITE_PUTER_MODEL || 'gpt-4o-mini',
        tools: options.tools,
      });

      return response;
    } catch (error: any) {
      const errorMessage = typeof error === 'object' ? JSON.stringify(error, null, 2) : error;
      console.error('[AiService] Puter SDK Error:', errorMessage);
      throw new Error(`Puter SDK Error: ${errorMessage}`);
    }
  }
}
