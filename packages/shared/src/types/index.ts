export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface ProviderConfig {
  id: string;
  userId: string;
  providerId: ProviderType;
  enabled: boolean;
  apiKey: string | null;
  baseUrl: string | null;
  models: string[];
}

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama';

export interface CacheEntry {
  id: string;
  userId: string | null;
  queryHash: string;
  response: string;
  model: string;
  expiresAt: Date;
  createdAt: Date;
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
