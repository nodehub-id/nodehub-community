import { pgTable, uuid, varchar, timestamp, real, index } from 'drizzle-orm/pg-core';
import { users } from './user';

export const requestLogs = pgTable('request_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  apiKeyId: uuid('api_key_id'),
  providerId: varchar('provider_id', { length: 50 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  promptTokens: real('prompt_tokens'),
  completionTokens: real('completion_tokens'),
  cost: real('cost'),
  cacheHit: real('cache_hit').default(0),
  durationMs: real('duration_ms'),
  status: varchar('status', { length: 20 }).notNull(),
  errorMessage: varchar('error_message', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('logs_user_id_idx').on(table.userId),
  createdAtIdx: index('logs_created_at_idx').on(table.createdAt),
}));
