import { pgTable, uuid, varchar, timestamp, text, real, index, vector, smallint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user';

export const cacheEntries = pgTable('cache_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  queryHash: varchar('query_hash', { length: 64 }).notNull(),
  // Vector with max dimensions - actual dimensions stored in embeddingDimensions
  queryEmbedding: vector('query_embedding', { dimensions: 2000 }),
  // Track actual embedding dimensions for matching (384, 768, 1024, 1536, etc.)
  embeddingDimensions: smallint('embedding_dimensions'),
  // Track which embedding provider generated this embedding
  embeddingProvider: varchar('embedding_provider', { length: 50 }),
  response: text('response').notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  promptTokens: real('prompt_tokens'),
  completionTokens: real('completion_tokens'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  queryHashIdx: index('cache_query_hash_idx').on(table.queryHash),
  userIdIdx: index('cache_user_id_idx').on(table.userId),
  expiresAtIdx: index('cache_expires_at_idx').on(table.expiresAt),
}));


export const cacheEntriesRelations = relations(cacheEntries, ({ one }) => ({
  user: one(users, { fields: [cacheEntries.userId], references: [users.id] }),
}));

export const cacheStats = pgTable('cache_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(),
  totalRequests: real('total_requests').default(0),
  cacheHits: real('cache_hits').default(0),
  cacheMisses: real('cache_misses').default(0),
  costSaved: real('cost_saved').default(0),
  costSpent: real('cost_spent').default(0),
}, (table) => ({
  userDateIdx: index('cache_stats_user_date_idx').on(table.userId, table.date),
}));

export const cacheStatsRelations = relations(cacheStats, ({ one }) => ({
  user: one(users, { fields: [cacheStats.userId], references: [users.id] }),
}));
