/**
 * Semantic Caching with pgvector
 * 
 * Two-layer caching system:
 * 1. Exact Match: Fast SHA-256 hash lookup
 * 2. Semantic Match: pgvector cosine similarity search
 * 
 * Community Edition:
 * - Fixed similarity threshold: 0.95
 * - Requires OPENAI_API_KEY for embeddings generation
 * - Falls back to exact match only if API key not configured
 */

import { createHash } from 'crypto';
import { db, cacheEntries, cacheStats } from '@nodehub/db';
import { eq, and, gt, sql, ne } from 'drizzle-orm';
import { getEmbeddingsService } from './embeddings';

export interface CacheConfig {
  /** Similarity threshold for semantic matching (0-1). Community: fixed at 0.95 */
  similarityThreshold: number;
  /** TTL in hours for cache entries. Default: 24 */
  ttlHours: number;
}

export interface CacheResult {
  response: string;
  hit: boolean;
  hitType: 'exact' | 'semantic' | 'none';
  model: string;
  similarity?: number;
}

export class SemanticCache {
  private config: CacheConfig;

  constructor(config: CacheConfig = { similarityThreshold: 0.95, ttlHours: 24 }) {
    this.config = config;
  }

  private generateHash(query: string): string {
    return createHash('sha256').update(query).digest('hex');
  }

  /**
   * Get cached response for a query
   * 
   * Strategy:
   * 1. Try exact hash match (fast, ~5ms)
   * 2. If no exact match, try semantic search with pgvector (~50ms)
   * 3. Return null if no match found
   */
  async get(userId: string | null, query: string, model: string): Promise<CacheResult | null> {
    const queryHash = this.generateHash(query);
    
    // 1. Try exact match first (fast path)
    const exactMatch = await db.query.cacheEntries.findFirst({
      where: and(
        eq(cacheEntries.queryHash, queryHash),
        eq(cacheEntries.model, model),
        gt(cacheEntries.expiresAt, new Date()),
        userId ? eq(cacheEntries.userId, userId) : sql`${cacheEntries.userId} IS NULL`
      ),
    });

    if (exactMatch) {
      await this.updateStats(userId, true, 0); // 0 cost saved for exact hit tracking
      return { 
        response: exactMatch.response, 
        hit: true, 
        hitType: 'exact',
        model,
        similarity: 1.0,
      };
    }

    // 2. Try semantic search using pgvector
    const embeddingsService = getEmbeddingsService();
    
    if (embeddingsService.isEnabled()) {
      const queryEmbedding = await embeddingsService.generateEmbedding(query);
      
      if (queryEmbedding) {
        const semanticMatch = await this.findSimilarEntry(
          userId, 
          model, 
          queryEmbedding, 
          queryHash
        );
        
        if (semanticMatch) {
          await this.updateStats(userId, true, 0);
          return {
            response: semanticMatch.response,
            hit: true,
            hitType: 'semantic',
            model,
            similarity: semanticMatch.similarity,
          };
        }
      }
    }

    // 3. No match found
    await this.updateStats(userId, false, 0);
    return null;
  }

  /**
   * Find similar cache entry using pgvector cosine similarity
   */
  private async findSimilarEntry(
    userId: string | null,
    model: string,
    queryEmbedding: number[],
    excludeHash: string
  ): Promise<{ response: string; similarity: number } | null> {
    try {
      // Use pgvector's cosine distance operator (<=>)
      // Cosine distance = 1 - cosine similarity
      // So we want distance < (1 - threshold)
      const maxDistance = 1 - this.config.similarityThreshold;
      
      // Format embedding as pgvector string
      const embeddingStr = `[${queryEmbedding.join(',')}]`;
      
      // Raw SQL query for pgvector similarity search
      const result = await db.execute(sql`
        SELECT 
          response,
          1 - (query_embedding <=> ${embeddingStr}::vector) as similarity
        FROM cache_entries
        WHERE 
          model = ${model}
          AND expires_at > NOW()
          AND query_hash != ${excludeHash}
          AND query_embedding IS NOT NULL
          ${userId ? sql`AND user_id = ${userId}` : sql`AND user_id IS NULL`}
          AND (query_embedding <=> ${embeddingStr}::vector) < ${maxDistance}
        ORDER BY query_embedding <=> ${embeddingStr}::vector
        LIMIT 1
      `);

      const rows = result.rows as any[];
      if (rows.length > 0 && rows[0].similarity >= this.config.similarityThreshold) {
        return {
          response: rows[0].response,
          similarity: rows[0].similarity,
        };
      }
      
      return null;
    } catch (error) {
      console.error('[SemanticCache] pgvector search failed:', error);
      return null;
    }
  }

  /**
   * Store a response in the cache with embedding
   */
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

    // Generate embedding for semantic search
    const embeddingsService = getEmbeddingsService();
    let queryEmbedding: number[] | null = null;
    
    if (embeddingsService.isEnabled()) {
      queryEmbedding = await embeddingsService.generateEmbedding(query);
    }

    // Insert cache entry
    if (queryEmbedding) {
      // With embedding - use raw SQL for pgvector
      const embeddingStr = `[${queryEmbedding.join(',')}]`;
      await db.execute(sql`
        INSERT INTO cache_entries (
          user_id, query_hash, query_embedding, response, model, 
          prompt_tokens, completion_tokens, expires_at
        ) VALUES (
          ${userId}, ${queryHash}, ${embeddingStr}::vector, ${response}, ${model},
          ${tokens.prompt}, ${tokens.completion}, ${expiresAt}
        )
      `);
    } else {
      // Without embedding - exact match only
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
  }

  /**
   * Clear all cache entries for a user
   */
  async clear(userId: string): Promise<void> {
    await db.delete(cacheEntries).where(eq(cacheEntries.userId, userId));
  }

  /**
   * Get cache statistics for a user
   */
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

  /**
   * Update daily cache statistics
   */
  private async updateStats(userId: string | null, hit: boolean, costSaved: number): Promise<void> {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];
    
    const existing = await db.query.cacheStats.findFirst({
      where: and(eq(cacheStats.userId, userId), eq(cacheStats.date, today)),
    });

    if (existing) {
      await db.update(cacheStats)
        .set({
          totalRequests: (existing.totalRequests || 0) + 1,
          cacheHits: (existing.cacheHits || 0) + (hit ? 1 : 0),
          cacheMisses: (existing.cacheMisses || 0) + (hit ? 0 : 1),
          costSaved: (existing.costSaved || 0) + costSaved,
        })
        .where(eq(cacheStats.id, existing.id));
    } else {
      await db.insert(cacheStats).values({
        userId,
        date: today,
        totalRequests: 1,
        cacheHits: hit ? 1 : 0,
        cacheMisses: hit ? 0 : 1,
        costSaved: costSaved,
      });
    }
  }

  /**
   * Get cache entry count for a user
   */
  async getEntryCount(userId: string): Promise<number> {
    const entries = await db.query.cacheEntries.findMany({
      where: and(
        eq(cacheEntries.userId, userId),
        gt(cacheEntries.expiresAt, new Date())
      ),
      columns: { id: true },
    });
    return entries.length;
  }

  /**
   * Check if semantic caching is enabled
   */
  isSemanticEnabled(): boolean {
    return getEmbeddingsService().isEnabled();
  }
}
