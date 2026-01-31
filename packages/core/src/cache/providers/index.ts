/**
 * Embedding Providers Factory
 * 
 * Creates embedding providers based on configuration.
 * Default provider is 'local' (no API key required).
 */

import {
    EmbeddingProvider,
    EmbeddingProviderConfig,
    EmbeddingProviderType,
    EMBEDDING_PROVIDER_INFO,
    getDefaultModel,
    getDefaultDimensions,
} from '../types';
import { LocalTransformersProvider } from './local';
import { OllamaEmbeddingProvider } from './ollama';
import { HuggingFaceTEIProvider } from './huggingface-tei';
import { OpenAIEmbeddingProvider } from './openai';

// Re-export providers
export { LocalTransformersProvider } from './local';
export { OllamaEmbeddingProvider } from './ollama';
export { HuggingFaceTEIProvider } from './huggingface-tei';
export { OpenAIEmbeddingProvider } from './openai';

/**
 * Create an embedding provider based on configuration
 * 
 * @param config - Provider configuration
 * @returns Configured embedding provider
 * 
 * @example
 * // Default provider (local transformers)
 * const provider = createEmbeddingProvider();
 * 
 * @example
 * // Ollama provider
 * const provider = createEmbeddingProvider({
 *   provider: 'ollama',
 *   baseUrl: 'http://localhost:11434',
 *   model: 'nomic-embed-text',
 * });
 * 
 * @example
 * // OpenAI provider
 * const provider = createEmbeddingProvider({
 *   provider: 'openai',
 *   apiKey: 'sk-...',
 * });
 */
export function createEmbeddingProvider(config?: EmbeddingProviderConfig): EmbeddingProvider {
    const providerType = config?.provider || getDefaultProviderType();

    switch (providerType) {
        case 'local':
            return new LocalTransformersProvider({
                model: config?.model,
                dimensions: config?.dimensions,
            });

        case 'ollama':
            return new OllamaEmbeddingProvider({
                baseUrl: config?.baseUrl,
                model: config?.model,
                dimensions: config?.dimensions,
            });

        case 'huggingface-tei':
            return new HuggingFaceTEIProvider({
                baseUrl: config?.baseUrl,
                model: config?.model,
                dimensions: config?.dimensions,
            });

        case 'openai':
            return new OpenAIEmbeddingProvider({
                apiKey: config?.apiKey,
                model: config?.model,
                dimensions: config?.dimensions,
            });

        default:
            console.warn(`[EmbeddingProvider] Unknown provider type: ${providerType}, falling back to local`);
            return new LocalTransformersProvider();
    }
}

/**
 * Get the default provider type from environment or fallback to 'local'
 */
export function getDefaultProviderType(): EmbeddingProviderType {
    const envProvider = process.env.EMBEDDING_PROVIDER as EmbeddingProviderType | undefined;

    if (envProvider && EMBEDDING_PROVIDER_INFO[envProvider]) {
        return envProvider;
    }

    // Default to 'local' - no API key required
    return 'local';
}

/**
 * Create provider from environment variables
 */
export function createEmbeddingProviderFromEnv(): EmbeddingProvider {
    const providerType = getDefaultProviderType();

    return createEmbeddingProvider({
        provider: providerType,
        apiKey: process.env.EMBEDDING_OPENAI_API_KEY,
        baseUrl: providerType === 'ollama'
            ? process.env.EMBEDDING_OLLAMA_URL
            : process.env.EMBEDDING_TEI_URL,
        model: process.env.EMBEDDING_MODEL,
    });
}

// Singleton instance for the default provider
let defaultProvider: EmbeddingProvider | null = null;

/**
 * Get the shared default embedding provider instance
 */
export function getEmbeddingProvider(): EmbeddingProvider {
    if (!defaultProvider) {
        defaultProvider = createEmbeddingProviderFromEnv();
    }
    return defaultProvider;
}

/**
 * Reset the default provider (useful for testing or config changes)
 */
export function resetEmbeddingProvider(): void {
    defaultProvider = null;
}
