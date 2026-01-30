import { NextResponse } from "next/server";
import { db } from "@nodehub/db";

export async function GET() {
  try {
    // Check database connection
    await db.query.users.findFirst();
    
    return NextResponse.json(
      { status: "healthy", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: "Database connection failed" },
      { status: 503 }
    );
  }
}
