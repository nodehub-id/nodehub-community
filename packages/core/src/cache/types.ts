/**
 * Embedding Provider Types
 * 
 * Defines the interface for embedding providers and related types.
 */

/**
 * Base interface that all embedding providers must implement
 */
export interface EmbeddingProvider {
    /** Provider name for identification */
    readonly name: string;

    /** Embedding dimensions this provider produces */
    readonly dimensions: number;

    /** Check if provider is properly configured and enabled */
    isEnabled(): boolean;

    /** Generate embedding for a single text */
    generateEmbedding(text: string): Promise<number[] | null>;

    /** Generate embeddings for multiple texts (batch) */
    generateEmbeddings?(texts: string[]): Promise<(number[] | null)[]>;
}

/**
 * Supported embedding provider types
 */
export type EmbeddingProviderType = 'local' | 'ollama' | 'huggingface-tei' | 'openai';

/**
 * Configuration for creating an embedding provider
 */
export interface EmbeddingProviderConfig {
    /** Provider type */
    provider: EmbeddingProviderType;
    /** API key (for OpenAI) */
    apiKey?: string;
    /** Base URL (for Ollama, HuggingFace TEI) */
    baseUrl?: string;
    /** Model name/ID */
    model?: string;
    /** Override dimensions (optional) */
    dimensions?: number;
}

/**
 * Provider metadata for UI display
 */
export interface EmbeddingProviderInfo {
    name: string;
    description: string;
    requiresKey: boolean;
    requiresUrl: boolean;
    defaultModel: string;
    defaultDimensions: number;
    documentationUrl: string;
}

/**
 * Registry of all supported embedding providers with their metadata
 */
export const EMBEDDING_PROVIDER_INFO: Record<EmbeddingProviderType, EmbeddingProviderInfo> = {
    local: {
        name: 'Local Transformers',
        description: 'In-process embeddings using @xenova/transformers (free, no server needed)',
        requiresKey: false,
        requiresUrl: false,
        defaultModel: 'Xenova/all-MiniLM-L6-v2',
        defaultDimensions: 384,
        documentationUrl: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2',
    },
    ollama: {
        name: 'Ollama',
        description: 'Self-hosted embeddings using Ollama (free, local)',
        requiresKey: false,
        requiresUrl: true,
        defaultModel: 'nomic-embed-text',
        defaultDimensions: 768,
        documentationUrl: 'https://ollama.com',
    },
    'huggingface-tei': {
        name: 'HuggingFace TEI',
        description: 'Text Embeddings Inference server (free, self-hosted)',
        requiresKey: false,
        requiresUrl: true,
        defaultModel: 'BAAI/bge-small-en-v1.5',
        defaultDimensions: 384,
        documentationUrl: 'https://huggingface.co/docs/text-embeddings-inference',
    },
    openai: {
        name: 'OpenAI',
        description: 'Cloud-based embeddings using OpenAI API (requires API key)',
        requiresKey: true,
        requiresUrl: false,
        defaultModel: 'text-embedding-3-small',
        defaultDimensions: 1536,
        documentationUrl: 'https://platform.openai.com/docs/guides/embeddings',
    },
};

/**
 * Get default model for a provider type
 */
export function getDefaultModel(provider: EmbeddingProviderType): string {
    return EMBEDDING_PROVIDER_INFO[provider].defaultModel;
}

/**
 * Get default dimensions for a provider type
 */
export function getDefaultDimensions(provider: EmbeddingProviderType): number {
    return EMBEDDING_PROVIDER_INFO[provider].defaultDimensions;
}
