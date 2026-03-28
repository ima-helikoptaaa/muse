export enum LLMProviderType {
  CLAUDE = 'claude',
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  model?: string;
}

export interface LLMCompletionResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  provider: string;
  model: string;
}
