/**
 * Embeddings Service for Semantic Caching
 * 
 * Unified interface for generating embeddings using multiple providers:
 * - Local Transformers (default, no API key required)
 * - Ollama (self-hosted)
 * - HuggingFace TEI (self-hosted)
 * - OpenAI (cloud)
 * 
 * Configure via environment variables:
 *   EMBEDDING_PROVIDER=local|ollama|huggingface-tei|openai
 *   EMBEDDING_MODEL=... (optional, defaults based on provider)
 * 
 * Provider-specific variables:
 *   EMBEDDING_OLLAMA_URL=http://localhost:11434
 *   EMBEDDING_TEI_URL=http://localhost:8080
 *   EMBEDDING_OPENAI_API_KEY=sk-...
 */

export * from './types';
export * from './providers';

import {
  EmbeddingProvider,
  EmbeddingProviderConfig,
  EmbeddingProviderType,
  EMBEDDING_PROVIDER_INFO,
  getDefaultDimensions,
} from './types';
import {
  createEmbeddingProvider,
  getEmbeddingProvider,
  resetEmbeddingProvider,
  createEmbeddingProviderFromEnv,
} from './providers';

/**
 * Legacy EmbeddingsService class for backward compatibility
 * 
 * @deprecated Use createEmbeddingProvider() or getEmbeddingProvider() instead
 */
export class EmbeddingsService {
  private provider: EmbeddingProvider;

  constructor(config?: Partial<EmbeddingProviderConfig>) {
    this.provider = createEmbeddingProvider(config as EmbeddingProviderConfig);
  }

  /**
   * Check if embeddings service is available
   */
  isEnabled(): boolean {
    return this.provider.isEnabled();
  }

  /**
   * Generate embedding for a query string
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    return this.provider.generateEmbedding(text);
  }

  /**
   * Generate embeddings for multiple texts in a batch
   */
  async generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    if (this.provider.generateEmbeddings) {
      return this.provider.generateEmbeddings(texts);
    }
    // Fallback: process one by one
    const embeddings: (number[] | null)[] = [];
    for (const text of texts) {
      embeddings.push(await this.provider.generateEmbedding(text));
    }
    return embeddings;
  }

  /**
   * Get embedding dimensions
   */
  getDimensions(): number {
    return this.provider.dimensions;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.provider.name;
  }
}

// Singleton instance for backward compatibility
let embeddingsService: EmbeddingsService | null = null;

/**
 * Get the shared embeddings service instance
 * 
 * @deprecated Use getEmbeddingProvider() instead
 */
export function getEmbeddingsService(): EmbeddingsService {
  if (!embeddingsService) {
    embeddingsService = new EmbeddingsService();
  }
  return embeddingsService;
}

/**
 * Reset the embeddings service (useful for testing or config changes)
 */
export function resetEmbeddingsService(): void {
  embeddingsService = null;
  resetEmbeddingProvider();
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}
