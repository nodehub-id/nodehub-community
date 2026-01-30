/**
 * Embeddings Service for Semantic Caching
 * 
 * Generates embeddings using OpenAI's text-embedding-3-small model.
 * This is required for semantic cache matching in Community Edition.
 * 
 * Configure via environment variable:
 *   OPENAI_API_KEY=sk-... (required for semantic caching)
 */

export interface EmbeddingConfig {
  /** OpenAI API key for embeddings generation */
  apiKey: string;
  /** Model to use for embeddings. Default: text-embedding-3-small */
  model: string;
  /** Dimensions for the embedding. Default: 1536 */
  dimensions: number;
}

const DEFAULT_CONFIG: Partial<EmbeddingConfig> = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
};

export class EmbeddingsService {
  private config: EmbeddingConfig;
  private enabled: boolean;

  constructor(config?: Partial<EmbeddingConfig>) {
    const apiKey = config?.apiKey || process.env.OPENAI_API_KEY || '';
    
    this.config = {
      apiKey,
      model: config?.model || DEFAULT_CONFIG.model!,
      dimensions: config?.dimensions || DEFAULT_CONFIG.dimensions!,
    };
    
    this.enabled = !!this.config.apiKey;
    
    if (!this.enabled) {
      console.warn('[Embeddings] OPENAI_API_KEY not configured. Semantic caching disabled, using exact match only.');
    }
  }

  /**
   * Check if embeddings service is available
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Generate embedding for a query string
   * Returns null if service is not enabled
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          input: text,
          dimensions: this.config.dimensions,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('[Embeddings] API error:', response.status, error);
        return null;
      }

      const data = await response.json();
      return data.data?.[0]?.embedding || null;
    } catch (error) {
      console.error('[Embeddings] Failed to generate embedding:', error);
      return null;
    }
  }

  /**
   * Generate embeddings for multiple texts in a batch
   */
  async generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    if (!this.enabled || texts.length === 0) {
      return texts.map(() => null);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          input: texts,
          dimensions: this.config.dimensions,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('[Embeddings] Batch API error:', response.status, error);
        return texts.map(() => null);
      }

      const data = await response.json();
      
      // Sort by index to ensure correct order
      const embeddings = data.data
        ?.sort((a: any, b: any) => a.index - b.index)
        ?.map((item: any) => item.embedding) || [];
      
      return embeddings;
    } catch (error) {
      console.error('[Embeddings] Failed to generate batch embeddings:', error);
      return texts.map(() => null);
    }
  }

  /**
   * Get embedding dimensions
   */
  getDimensions(): number {
    return this.config.dimensions;
  }
}

// Singleton instance
let embeddingsService: EmbeddingsService | null = null;

/**
 * Get the shared embeddings service instance
 */
export function getEmbeddingsService(): EmbeddingsService {
  if (!embeddingsService) {
    embeddingsService = new EmbeddingsService();
  }
  return embeddingsService;
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
