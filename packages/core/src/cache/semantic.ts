// Semantic caching with pgvector
import { createHash } from 'crypto';
import { db, cacheEntries, cacheStats } from '@nodehub/db';
import { eq, and, gt, sql } from 'drizzle-orm';

interface CacheConfig {
  similarityThreshold: number;
  ttlHours: number;
}

interface CacheResult {
  response: string;
  hit: boolean;
  model: string;
}

export class SemanticCache {
  private config: CacheConfig;

  constructor(config: CacheConfig = { similarityThreshold: 0.95, ttlHours: 24 }) {
    this.config = config;
  }

  private generateHash(query: string): string {
    return createHash('sha256').update(query).digest('hex');
  }

  async get(userId: string | null, query: string, model: string): Promise<CacheResult | null> {
    const queryHash = this.generateHash(query);
    
    // First try exact match (fast path)
    const exactMatch = await db.query.cacheEntries.findFirst({
      where: and(
        eq(cacheEntries.queryHash, queryHash),
        eq(cacheEntries.model, model),
        gt(cacheEntries.expiresAt, new Date()),
        userId ? eq(cacheEntries.userId, userId) : sql`${cacheEntries.userId} IS NULL`
      ),
    });

    if (exactMatch) {
      await this.updateStats(userId, true);
      return { response: exactMatch.response, hit: true, model };
    }

    // If no exact match and embeddings are available, try semantic search
    // Note: This requires OpenAI embeddings which would be implemented separately
    // For now, we rely on exact matching for the Community Edition
    
    await this.updateStats(userId, false);
    return null;
  }

  async set(
    userId: string | null, 
    query: string, 
    model: string, 
    response: string, 
    tokens: { prompt: number; completion: number }
  ): Promise<void> {
    const queryHash = this.generateHash(query);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.config.ttlHours);

    await db.insert(cacheEntries).values({
      userId,
      queryHash,
      model,
      response,
      promptTokens: tokens.prompt,
      completionTokens: tokens.completion,
      expiresAt,
    });
  }

  async clear(userId: string): Promise<void> {
    await db.delete(cacheEntries).where(eq(cacheEntries.userId, userId));
  }

  async getStats(userId: string, days: number = 7): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const stats = await db.query.cacheStats.findMany({
      where: and(
        eq(cacheStats.userId, userId),
        gt(cacheStats.date, startDateStr)
      ),
      orderBy: (stats, { asc }) => [asc(stats.date)],
    });

    return stats;
  }

  private async updateStats(userId: string | null, hit: boolean): Promise<void> {
    if (!userId) return; // Only track stats for authenticated users

    const today = new Date().toISOString().split('T')[0];
    
    // Check if stats exist for today
    const existing = await db.query.cacheStats.findFirst({
      where: and(eq(cacheStats.userId, userId), eq(cacheStats.date, today)),
    });

    if (existing) {
      // Update existing stats
      await db.update(cacheStats)
        .set({
          totalRequests: existing.totalRequests + 1,
          cacheHits: existing.cacheHits + (hit ? 1 : 0),
          cacheMisses: existing.cacheMisses + (hit ? 0 : 1),
        })
        .where(eq(cacheStats.id, existing.id));
    } else {
      // Create new stats entry
      await db.insert(cacheStats).values({
        userId,
        date: today,
        totalRequests: 1,
        cacheHits: hit ? 1 : 0,
        cacheMisses: hit ? 0 : 1,
      });
    }
  }

  async cleanupExpired(): Promise<number> {
    const result = await db.delete(cacheEntries)
      .where(gt(new Date(), cacheEntries.expiresAt));
    
    return 0; // Drizzle doesn't return count directly
  }
}
