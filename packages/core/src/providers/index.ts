import { BaseProvider, ProviderConfig, ProviderType, PROVIDER_MODELS, PROVIDER_COSTS } from './base';
import { OpenAIProvider } from './openai';

export * from './base';
export { OpenAIProvider } from './openai';

// Provider factory - will be extended with other providers
export function createProvider(type: ProviderType, config: ProviderConfig): BaseProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider(config);
    // Other providers will be implemented in Phase 3
    default:
      throw new Error(`Provider ${type} not yet implemented`);
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
