/**
 * OpenAI Embedding Provider
 * 
 * Uses OpenAI's embedding API for cloud-based embeddings.
 * Requires an OpenAI API key.
 * 
 * Models:
 * - text-embedding-3-small (1536 dimensions, default)
 * - text-embedding-3-large (3072 dimensions)
 * - text-embedding-ada-002 (1536 dimensions, legacy)
 */

import { EmbeddingProvider, EMBEDDING_PROVIDER_INFO } from '../types';

const DEFAULT_MODEL = EMBEDDING_PROVIDER_INFO.openai.defaultModel;
const DEFAULT_DIMENSIONS = EMBEDDING_PROVIDER_INFO.openai.defaultDimensions;

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
    readonly name = 'openai';
    readonly dimensions: number;
    private apiKey: string;
    private model: string;
    private enabled: boolean;

    constructor(config?: { apiKey?: string; model?: string; dimensions?: number }) {
        this.apiKey = config?.apiKey || process.env.EMBEDDING_OPENAI_API_KEY || '';
        this.model = config?.model || process.env.EMBEDDING_OPENAI_MODEL || DEFAULT_MODEL;
        this.dimensions = config?.dimensions || DEFAULT_DIMENSIONS;
        this.enabled = !!this.apiKey;
    }

    /**
     * Check if provider is configured
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Generate embedding for a single text
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
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    input: text,
                    dimensions: this.dimensions,
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                console.error('[OpenAI] API error:', response.status, error);
                return null;
            }

            const data = await response.json() as { data?: Array<{ embedding: number[] }> };
            return data.data?.[0]?.embedding || null;
        } catch (error) {
            console.error('[OpenAI] Failed to generate embedding:', error);
            return null;
        }
    }

    /**
     * Generate embeddings for multiple texts (batch supported)
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
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    input: texts,
                    dimensions: this.dimensions,
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                console.error('[OpenAI] Batch API error:', response.status, error);
                return texts.map(() => null);
            }

            const data = await response.json() as { data?: Array<{ index: number; embedding: number[] }> };

            // Sort by index to ensure correct order
            const embeddings = data.data
                ?.sort((a, b) => a.index - b.index)
                ?.map((item) => item.embedding) || [];

            return embeddings;
        } catch (error) {
            console.error('[OpenAI] Failed to generate batch embeddings:', error);
            return texts.map(() => null);
        }
    }
}
