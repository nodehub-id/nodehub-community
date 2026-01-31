import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, requestLogs } from "@nodehub/db";
import { eq, and, gt, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const days = parseInt(searchParams.get("days") || "7", 10);

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch recent request logs
    const logs = await db.query.requestLogs.findMany({
      where: and(
        eq(requestLogs.userId, userId),
        gt(requestLogs.createdAt, startDate)
      ),
      orderBy: desc(requestLogs.createdAt),
      limit: limit,
    });

    // Calculate summary statistics
    let totalRequests = logs.length;
    let cacheHits = 0;
    let totalDuration = 0;

    for (const log of logs) {
      if (log.cacheHit) cacheHits++;
      totalDuration += log.durationMs || 0;
    }

    const cacheHitRate = totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0;
    const avgResponseTime = totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0;

    // Format logs for frontend
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt?.toISOString() || new Date().toISOString(),
      model: log.model,
      provider: log.providerId,
      promptTokens: log.promptTokens || 0,
      completionTokens: log.completionTokens || 0,
      totalTokens: (log.promptTokens || 0) + (log.completionTokens || 0),
      cost: log.cost || 0,
      cacheHit: log.cacheHit === 1,
      responseTime: log.durationMs || 0,
      status: log.status,
    }));

    return NextResponse.json({
      logs: formattedLogs,
      summary: {
        totalRequests,
        cacheHitRate,
        avgResponseTime,
      },
    });
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch request logs" },
      { status: 500 }
    );
  }
}
