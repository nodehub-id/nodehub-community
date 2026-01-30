import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runCleanup, getCleanupConfigFromEnv } from "@nodehub/core/cleanup";

/**
 * Manual cleanup endpoint for admin users.
 * 
 * POST /api/cleanup
 * 
 * Triggers immediate cleanup of old analytics data.
 * Requires authentication.
 */
export async function POST(req: NextRequest) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const config = getCleanupConfigFromEnv();
    const result = await runCleanup(config.retentionDays);
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Removed data older than ${config.retentionDays} days.`,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error("Manual cleanup failed:", error);
    return NextResponse.json(
      { error: "Cleanup failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cleanup
 * 
 * Returns current cleanup configuration.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const config = getCleanupConfigFromEnv();
  
  return NextResponse.json({
    enabled: config.enabled,
    retentionDays: config.retentionDays,
    probability: config.probability,
    description: "Cleanup runs automatically during API requests with the configured probability.",
  });
}
