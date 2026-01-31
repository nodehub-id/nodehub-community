import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SemanticCache } from "@nodehub/core/cache";
import { db } from "@nodehub/db";
import { cacheEntries, eq, and, gt } from "@nodehub/db";

// Create a singleton instance
const semanticCache = new SemanticCache();

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Get cache statistics for last 7 days
    const stats = await semanticCache.getStats(userId, 7);

    // Get total cache entries count (non-expired)
    const totalEntries = await semanticCache.getEntryCount(userId);

    // Calculate totals from stats
    let totalRequests = 0;
    let totalHits = 0;
    let totalMisses = 0;
    let totalCostSaved = 0;

    for (const day of stats) {
      totalRequests += day.totalRequests || 0;
      totalHits += day.cacheHits || 0;
      totalMisses += day.cacheMisses || 0;
      totalCostSaved += day.costSaved || 0;
    }

    // Calculate hit rate
    const hitRate = totalRequests > 0 
      ? Math.round((totalHits / totalRequests) * 100) 
      : 0;

    // Get exact vs semantic hits (estimated breakdown)
    // In a real implementation, you might track this separately
    const exactHits = Math.round(totalHits * 0.7); // Estimate: 70% exact matches
    const semanticHits = totalHits - exactHits;

    // Calculate storage used (rough estimate based on entry count)
    // Assuming average entry size of ~5KB
    const avgEntrySize = 5120; // 5KB in bytes
    const storageBytes = totalEntries * avgEntrySize;
    const storageUsed = formatStorageSize(storageBytes);

    // Format cost savings
    const totalSavings = `$${totalCostSaved.toFixed(2)}`;

    return NextResponse.json({
      totalEntries,
      exactHits,
      semanticHits,
      totalSavings,
      hitRate: `${hitRate}%`,
      storageUsed,
      totalRequests,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch cache stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch cache statistics" },
      { status: 500 }
    );
  }
}

function formatStorageSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
