import { pgTable, uuid, varchar, timestamp, text, boolean, smallint, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user';

/**
 * Embedding Provider Configuration
 * 
 * Each user has ONE embedding provider config.
 * Used for semantic caching - generating embeddings for similarity search.
 * 
 * Supported providers:
 * - 'local': @xenova/transformers (default, no API key needed)
 * - 'ollama': Local Ollama instance
 * - 'huggingface-tei': HuggingFace Text Embeddings Inference
 * - 'openai': OpenAI Embeddings API
 */
export const embeddingProviderConfig = pgTable('embedding_provider_config', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),

    // Provider type: 'local' | 'ollama' | 'huggingface-tei' | 'openai'
    provider: varchar('provider', { length: 50 }).notNull().default('local'),

    // Provider-specific configuration
    apiKey: text('api_key'),           // For OpenAI
    baseUrl: text('base_url'),         // For Ollama, HuggingFace TEI
    model: varchar('model', { length: 200 }),  // Model name/ID

    // Embedding dimensions (set after first successful embedding)
    dimensions: smallint('dimensions'),

    // Status
    enabled: boolean('enabled').default(true).notNull(),
    isConfigured: boolean('is_configured').default(false).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index('embedding_provider_config_user_id_idx').on(table.userId),
}));

export const embeddingProviderConfigRelations = relations(embeddingProviderConfig, ({ one }) => ({
    user: one(users, { fields: [embeddingProviderConfig.userId], references: [users.id] }),
}));

// Type for provider selection
export type EmbeddingProviderType = 'local' | 'ollama' | 'huggingface-tei' | 'openai';
