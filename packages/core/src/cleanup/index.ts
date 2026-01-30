/**
 * Analytics Cleanup Service
 * 
 * Implements probabilistic on-request cleanup for self-hosted deployments.
 * This approach requires zero external dependencies (no cron, no pg_cron).
 * 
 * How it works:
 * 1. On each API request, there's a small probability (default 1%) of triggering cleanup
 * 2. Cleanup runs asynchronously (non-blocking) to avoid impacting request latency
 * 3. Deletes data older than the retention period (7 days for Community Edition)
 * 
 * This ensures cleanup happens naturally with usage, scaling automatically.
 */

import { db, requestLogs, cacheEntries, cacheStats } from '@nodehub/db';
import { lt, and } from 'drizzle-orm';

export interface CleanupConfig {
  /** Probability of running cleanup on each request (0-1). Default: 0.01 (1%) */
  probability: number;
  /** Retention period in days. Default: 7 for Community Edition */
  retentionDays: number;
  /** Enable cleanup. Default: true */
  enabled: boolean;
}

const DEFAULT_CONFIG: CleanupConfig = {
  probability: 0.01, // 1% chance per request
  retentionDays: 7,  // Community Edition: 7 days
  enabled: true,
};

// Track last cleanup to avoid running too frequently
let lastCleanupTime = 0;
const MIN_CLEANUP_INTERVAL_MS = 60 * 1000; // Minimum 1 minute between cleanups

/**
 * Run cleanup with probability check.
 * Call this on API requests - it will only actually run cleanup
 * based on the configured probability.
 */
export async function maybeRunCleanup(config: Partial<CleanupConfig> = {}): Promise<void> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!finalConfig.enabled) {
    return;
  }

  // Check if enough time has passed since last cleanup
  const now = Date.now();
  if (now - lastCleanupTime < MIN_CLEANUP_INTERVAL_MS) {
    return;
  }

  // Probabilistic check
  if (Math.random() > finalConfig.probability) {
    return;
  }

  // Run cleanup asynchronously (fire and forget)
  lastCleanupTime = now;
  runCleanup(finalConfig.retentionDays).catch((error) => {
    console.error('[Cleanup] Error during cleanup:', error);
  });
}

/**
 * Run the actual cleanup. Deletes:
 * 1. Request logs older than retention period
 * 2. Expired cache entries
 * 3. Cache stats older than retention period
 */
export async function runCleanup(retentionDays: number = 7): Promise<CleanupResult> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  const result: CleanupResult = {
    requestLogsDeleted: 0,
    cacheEntriesDeleted: 0,
    cacheStatsDeleted: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Delete old request logs
    await db.delete(requestLogs)
      .where(lt(requestLogs.createdAt, cutoffDate));
    
    // 2. Delete expired cache entries
    await db.delete(cacheEntries)
      .where(lt(cacheEntries.expiresAt, new Date()));
    
    // 3. Delete old cache stats
    await db.delete(cacheStats)
      .where(lt(cacheStats.date, cutoffDateStr));

    console.log(`[Cleanup] Completed: removed data older than ${retentionDays} days`);
  } catch (error) {
    console.error('[Cleanup] Failed:', error);
    throw error;
  }

  return result;
}

export interface CleanupResult {
  requestLogsDeleted: number;
  cacheEntriesDeleted: number;
  cacheStatsDeleted: number;
  timestamp: string;
}

/**
 * Get cleanup configuration from environment variables.
 */
export function getCleanupConfigFromEnv(): CleanupConfig {
  return {
    enabled: process.env.CLEANUP_ENABLED !== 'false',
    probability: parseFloat(process.env.CLEANUP_PROBABILITY || '0.01'),
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '7', 10),
  };
}
