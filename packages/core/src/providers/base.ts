export interface ProviderConfig {
  id: string;
  name: string;
  apiKey: string;
  baseUrl?: string;
  models: string[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export abstract class BaseProvider {
  constructor(protected config: ProviderConfig) {}

  abstract chatCompletions(request: ChatCompletionRequest): AsyncGenerator<ChatCompletionResponse>;
  abstract getModels(): Promise<string[]>;
  abstract calculateCost(model: string, promptTokens: number, completionTokens: number): number;
}

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama';

export const PROVIDER_MODELS: Record<ProviderType, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-opus-latest', 'claude-3-haiku-latest'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  groq: ['llama-3.2-70b', 'mixtral-8x7b'],
  ollama: [],
};

export const PROVIDER_COSTS: Record<ProviderType, Record<string, { prompt: number; completion: number }>> = {
  openai: {
    'gpt-4o': { prompt: 2.5 / 1000000, completion: 10 / 1000000 },
    'gpt-4o-mini': { prompt: 0.15 / 1000000, completion: 0.6 / 1000000 },
    'gpt-4': { prompt: 30 / 1000000, completion: 60 / 1000000 },
    'gpt-3.5-turbo': { prompt: 0.5 / 1000000, completion: 1.5 / 1000000 },
  },
  anthropic: {
    'claude-3-5-sonnet-latest': { prompt: 3 / 1000000, completion: 15 / 1000000 },
    'claude-3-opus-latest': { prompt: 15 / 1000000, completion: 75 / 1000000 },
    'claude-3-haiku-latest': { prompt: 0.25 / 1000000, completion: 1.25 / 1000000 },
  },
  google: {
    'gemini-1.5-pro': { prompt: 3.5 / 1000000, completion: 10.5 / 1000000 },
    'gemini-1.5-flash': { prompt: 0.35 / 1000000, completion: 1.05 / 1000000 },
  },
  groq: {
    'llama-3.2-70b': { prompt: 0.9 / 1000000, completion: 0.9 / 1000000 },
    'mixtral-8x7b': { prompt: 0.27 / 1000000, completion: 0.27 / 1000000 },
  },
  ollama: {},
};
