/**
 * HuggingFace Text Embeddings Inference (TEI) Provider
 * 
 * Uses HuggingFace's Text Embeddings Inference server for embeddings.
 * TEI is a dedicated inference server for text embeddings.
 * 
 * Run TEI server:
 *   docker run --gpus all -p 8080:80 \
 *     ghcr.io/huggingface/text-embeddings-inference:latest \
 *     --model-id BAAI/bge-small-en-v1.5
 */

import { EmbeddingProvider, EMBEDDING_PROVIDER_INFO } from '../types';

const DEFAULT_BASE_URL = 'http://localhost:8080';
const DEFAULT_MODEL = EMBEDDING_PROVIDER_INFO['huggingface-tei'].defaultModel;
const DEFAULT_DIMENSIONS = EMBEDDING_PROVIDER_INFO['huggingface-tei'].defaultDimensions;

export class HuggingFaceTEIProvider implements EmbeddingProvider {
    readonly name = 'huggingface-tei';
    readonly dimensions: number;
    private baseUrl: string;
    private model: string;
    private enabled: boolean;

    constructor(config?: { baseUrl?: string; model?: string; dimensions?: number }) {
        this.baseUrl = config?.baseUrl || process.env.EMBEDDING_TEI_URL || DEFAULT_BASE_URL;
        this.model = config?.model || process.env.EMBEDDING_TEI_MODEL || DEFAULT_MODEL;
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
            const response = await fetch(`${this.baseUrl}/embed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: text,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('[HuggingFace TEI] API error:', response.status, error);
                return null;
            }

            const data = await response.json() as number[][];
            // TEI returns array of embeddings, we take the first one
            return data[0] || null;
        } catch (error) {
            console.error('[HuggingFace TEI] Failed to generate embedding:', error);
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
            const response = await fetch(`${this.baseUrl}/embed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: texts,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('[HuggingFace TEI] Batch API error:', response.status, error);
                return texts.map(() => null);
            }

            const data = await response.json() as number[][];
            return data;
        } catch (error) {
            console.error('[HuggingFace TEI] Failed to generate batch embeddings:', error);
            return texts.map(() => null);
        }
    }
}
