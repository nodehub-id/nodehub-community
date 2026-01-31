/**
 * Ollama Embedding Provider
 * 
 * Uses Ollama's embedding endpoint for local embeddings.
 * Requires Ollama to be running with an embedding model pulled.
 * 
 * Popular embedding models:
 * - nomic-embed-text (768 dimensions, good quality)
 * - mxbai-embed-large (1024 dimensions, better quality)
 * - all-minilm (384 dimensions, fast)
 */

import { EmbeddingProvider, EMBEDDING_PROVIDER_INFO } from '../types';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = EMBEDDING_PROVIDER_INFO.ollama.defaultModel;
const DEFAULT_DIMENSIONS = EMBEDDING_PROVIDER_INFO.ollama.defaultDimensions;

export class OllamaEmbeddingProvider implements EmbeddingProvider {
    readonly name = 'ollama';
    readonly dimensions: number;
    private baseUrl: string;
    private model: string;
    private enabled: boolean;

    constructor(config?: { baseUrl?: string; model?: string; dimensions?: number }) {
        this.baseUrl = config?.baseUrl || process.env.EMBEDDING_OLLAMA_URL || DEFAULT_BASE_URL;
        this.model = config?.model || process.env.EMBEDDING_OLLAMA_MODEL || DEFAULT_MODEL;
        this.dimensions = config?.dimensions || DEFAULT_DIMENSIONS;
        this.enabled = !!this.baseUrl;
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
            const response = await fetch(`${this.baseUrl}/api/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: text,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('[Ollama] API error:', response.status, error);
                return null;
            }

            const data = await response.json() as { embedding?: number[] };
            return data.embedding || null;
        } catch (error) {
            console.error('[Ollama] Failed to generate embedding:', error);
            return null;
        }
    }

    /**
     * Generate embeddings for multiple texts
     */
    async generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
        if (!this.enabled || texts.length === 0) {
            return texts.map(() => null);
        }

        // Ollama doesn't support batch embeddings, process one by one
        const embeddings: (number[] | null)[] = [];
        for (const text of texts) {
            const embedding = await this.generateEmbedding(text);
            embeddings.push(embedding);
        }
        return embeddings;
    }
}
