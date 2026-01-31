/**
 * Local Transformers Embedding Provider
 * 
 * Uses @xenova/transformers to run embeddings locally in-process.
 * This is the DEFAULT provider - no API key or external service required.
 * 
 * First request may be slow as it downloads the model (~90MB).
 * Subsequent requests are fast as the model is cached.
 */

import { EmbeddingProvider, EMBEDDING_PROVIDER_INFO } from '../types';

// We use dynamic import to make @xenova/transformers optional
let pipeline: any = null;
let extractor: any = null;

const DEFAULT_MODEL = EMBEDDING_PROVIDER_INFO.local.defaultModel;
const DEFAULT_DIMENSIONS = EMBEDDING_PROVIDER_INFO.local.defaultDimensions;

export class LocalTransformersProvider implements EmbeddingProvider {
    readonly name = 'local';
    readonly dimensions: number;
    private model: string;
    private initialized = false;
    private initPromise: Promise<void> | null = null;

    constructor(config?: { model?: string; dimensions?: number }) {
        this.model = config?.model || DEFAULT_MODEL;
        this.dimensions = config?.dimensions || DEFAULT_DIMENSIONS;
    }

    /**
     * Check if provider is enabled (always true for local)
     */
    isEnabled(): boolean {
        return true;
    }

    /**
     * Initialize the transformer pipeline (lazy load)
     */
    private async initialize(): Promise<void> {
        if (this.initialized) return;

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                // Dynamic import for optional dependency
                const transformers = await import('@xenova/transformers');
                pipeline = transformers.pipeline;

                console.log(`[LocalTransformers] Loading model: ${this.model}...`);
                extractor = await pipeline('feature-extraction', this.model, {
                    progress_callback: (progress: any) => {
                        if (progress.status === 'downloading') {
                            console.log(`[LocalTransformers] Downloading: ${progress.file} (${Math.round(progress.progress || 0)}%)`);
                        }
                    },
                });

                this.initialized = true;
                console.log(`[LocalTransformers] Model loaded successfully`);
            } catch (error) {
                console.error('[LocalTransformers] Failed to initialize:', error);
                throw error;
            }
        })();

        return this.initPromise;
    }

    /**
     * Generate embedding for a single text
     */
    async generateEmbedding(text: string): Promise<number[] | null> {
        try {
            await this.initialize();

            if (!extractor) {
                console.error('[LocalTransformers] Extractor not initialized');
                return null;
            }

            const output = await extractor(text, {
                pooling: 'mean',
                normalize: true
            });

            // Convert to regular array
            const embedding = Array.from(output.data as Float32Array);
            return embedding;
        } catch (error) {
            console.error('[LocalTransformers] Failed to generate embedding:', error);
            return null;
        }
    }

    /**
     * Generate embeddings for multiple texts
     */
    async generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
        try {
            await this.initialize();

            if (!extractor) {
                return texts.map(() => null);
            }

            // Process texts one by one (batch processing not well supported)
            const embeddings: (number[] | null)[] = [];
            for (const text of texts) {
                const embedding = await this.generateEmbedding(text);
                embeddings.push(embedding);
            }

            return embeddings;
        } catch (error) {
            console.error('[LocalTransformers] Failed to generate batch embeddings:', error);
            return texts.map(() => null);
        }
    }
}
