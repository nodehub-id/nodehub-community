import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, requestLogs, cacheStats, eq, and, gt, sql } from "@nodehub/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7", 10);

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Fetch request logs for the time period
    const logs = await db.query.requestLogs.findMany({
      where: and(
        eq(requestLogs.userId, userId),
        gt(requestLogs.createdAt, startDate)
      ),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    });

    // Fetch cache stats
    const cacheStatRecords = await db.query.cacheStats.findMany({
      where: and(
        eq(cacheStats.userId, userId),
        gt(cacheStats.date, startDateStr)
      ),
      orderBy: (stats, { asc }) => [asc(stats.date)],
    });

    // Calculate summary statistics
    let totalRequests = logs.length;
    let totalTokens = 0;
    let totalCost = 0;
    let cacheHits = 0;
    let totalDuration = 0;

    // Group by model for model distribution
    const modelCounts: Record<string, number> = {};

    // Group by day for daily stats
    const dailyStats: Record<string, { requests: number; tokens: number; cost: number }> = {};

    for (const log of logs) {
      // Totals
      totalTokens += (log.promptTokens || 0) + (log.completionTokens || 0);
      totalCost += log.cost || 0;
      totalDuration += log.durationMs || 0;
      if (log.cacheHit) cacheHits++;

      // Model distribution
      const model = log.model || "unknown";
      modelCounts[model] = (modelCounts[model] || 0) + 1;

      // Daily stats
      const date = log.createdAt ? new Date(log.createdAt).toISOString().split("T")[0] : "unknown";
      if (!dailyStats[date]) {
        dailyStats[date] = { requests: 0, tokens: 0, cost: 0 };
      }
      dailyStats[date].requests++;
      dailyStats[date].tokens += (log.promptTokens || 0) + (log.completionTokens || 0);
      dailyStats[date].cost += log.cost || 0;
    }

    // Format daily data for charts (last 7 days)
    const dailyData = Object.entries(dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
        requests: data.requests,
        tokens: data.tokens,
        cost: data.cost,
      }));

    // Format model distribution
    const totalModelRequests = Object.values(modelCounts).reduce((a, b) => a + b, 0);
    const modelData = Object.entries(modelCounts)
      .map(([name, requests]) => ({
        name,
        requests,
        percentage: totalModelRequests > 0 ? Math.round((requests / totalModelRequests) * 100) : 0,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    // Calculate metrics
    const cacheHitRate = totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0;
    const avgResponseTime = totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0;

    // Calculate cost savings from cache stats
    let totalCostSaved = 0;
    for (const stat of cacheStatRecords) {
      totalCostSaved += stat.costSaved || 0;
    }

    return NextResponse.json({
      summary: {
        totalRequests,
        totalTokens,
        totalCost: Number(totalCost.toFixed(2)),
        cacheHitRate,
        avgResponseTime,
        totalCostSaved: Number(totalCostSaved.toFixed(2)),
      },
      dailyData,
      modelData,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
