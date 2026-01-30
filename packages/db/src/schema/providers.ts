import { pgTable, uuid, varchar, timestamp, text, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './user';

export const providerConfigs = pgTable('provider_configs', {
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
  userProviderIdx: index('provider_configs_user_provider_idx').on(table.userId, table.providerId),
}));
