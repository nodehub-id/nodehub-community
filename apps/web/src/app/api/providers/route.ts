import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, providerConfigs } from "@nodehub/db";
import { eq, and } from "drizzle-orm";
import { PROVIDER_MODELS } from "@nodehub/core/providers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await db.query.providerConfigs.findMany({
    where: eq(providerConfigs.userId, session.user.id),
  });

  // Return all 5 providers with their status
  const providers = Object.keys(PROVIDER_MODELS).map((providerId) => {
    const config = configs.find((c) => c.providerId === providerId);
    return {
      id: providerId,
      name: providerId.charAt(0).toUpperCase() + providerId.slice(1),
      enabled: config?.enabled || false,
      models: PROVIDER_MODELS[providerId as keyof typeof PROVIDER_MODELS],
      apiKeySet: !!config?.apiKey,
      // For Ollama, return the base URL so it can be displayed (not a sensitive API key)
      baseUrl: providerId === "ollama" ? config?.apiKey : undefined,
    };
  });

  return NextResponse.json({ providers });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { providerId, enabled, apiKey } = body;

  if (!providerId) {
    return NextResponse.json(
      { error: "Provider ID required" },
      { status: 400 }
    );
  }

  const existing = await db.query.providerConfigs.findFirst({
    where: and(
      eq(providerConfigs.userId, session.user.id),
      eq(providerConfigs.providerId, providerId)
    ),
  });

  if (existing) {
    await db.update(providerConfigs)
      .set({
        enabled,
        apiKey: apiKey || existing.apiKey,
        updatedAt: new Date(),
      })
      .where(eq(providerConfigs.id, existing.id));
  } else {
    await db.insert(providerConfigs).values({
      userId: session.user.id,
      providerId,
      enabled,
      apiKey,
      models: PROVIDER_MODELS[providerId as keyof typeof PROVIDER_MODELS],
    });
  }

  return NextResponse.json({ success: true });
}
