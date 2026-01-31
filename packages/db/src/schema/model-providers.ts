import { pgTable, uuid, varchar, timestamp, text, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user';

/**
 * Model Provider Configurations
 * 
 * Stores API keys and settings for LLM providers (OpenAI, Anthropic, etc.)
 * Used for chat completions, NOT for embeddings.
 */
export const modelProviderConfigs = pgTable('model_provider_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: varchar('provider_id', { length: 50 }).notNull(),
  enabled: boolean('enabled').default(false).notNull(),
  apiKey: text('api_key'),
  baseUrl: text('base_url'),
  models: jsonb('models').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userProviderIdx: index('model_provider_configs_user_provider_idx').on(table.userId, table.providerId),
}));

export const modelProviderConfigsRelations = relations(modelProviderConfigs, ({ one }) => ({
  user: one(users, { fields: [modelProviderConfigs.userId], references: [users.id] }),
}));
