import { BaseProvider, ProviderConfig, ProviderType, PROVIDER_MODELS, PROVIDER_COSTS } from './base';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';
import { GroqProvider } from './groq';
import { OllamaProvider } from './ollama';

export * from './base';
export { OpenAIProvider } from './openai';
export { AnthropicProvider } from './anthropic';
export { GoogleProvider } from './google';
export { GroqProvider } from './groq';
export { OllamaProvider } from './ollama';

// Provider factory
export function createProvider(type: ProviderType, config: ProviderConfig): BaseProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'google':
      return new GoogleProvider(config);
    case 'groq':
      return new GroqProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    default:
      throw new Error(`Provider ${type} not supported`);
  }
}

export function getProviderModels(type: ProviderType): string[] {
  return PROVIDER_MODELS[type] || [];
}

export function calculateProviderCost(type: ProviderType, model: string, promptTokens: number, completionTokens: number): number {
  const costs = PROVIDER_COSTS[type];
  if (!costs) return 0;

  const modelCosts = costs[model];
  if (!modelCosts) return 0;

  return (promptTokens * modelCosts.prompt) + (completionTokens * modelCosts.completion);
}
