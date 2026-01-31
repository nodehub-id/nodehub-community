import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, modelProviderConfigs } from "@nodehub/db";
import { eq, and } from "drizzle-orm";
import { PROVIDER_MODELS } from "@nodehub/core/providers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await db.query.modelProviderConfigs.findMany({
    where: eq(modelProviderConfigs.userId, session.user.id),
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
      // For Ollama, return the base URL (stored in baseUrl field)
      baseUrl: providerId === "ollama" ? config?.baseUrl : undefined,
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
  const { providerId, enabled, apiKey, baseUrl } = body;

  if (!providerId) {
    return NextResponse.json(
      { error: "Provider ID required" },
      { status: 400 }
    );
  }

  const existing = await db.query.modelProviderConfigs.findFirst({
    where: and(
      eq(modelProviderConfigs.userId, session.user.id),
      eq(modelProviderConfigs.providerId, providerId)
    ),
  });

  if (existing) {
    await db.update(modelProviderConfigs)
      .set({
        enabled,
        apiKey: apiKey || existing.apiKey,
        baseUrl: baseUrl || existing.baseUrl,
        updatedAt: new Date(),
      })
      .where(eq(modelProviderConfigs.id, existing.id));
  } else {
    await db.insert(modelProviderConfigs).values({
      userId: session.user.id,
      providerId,
      enabled,
      apiKey,
      baseUrl,
      models: PROVIDER_MODELS[providerId as keyof typeof PROVIDER_MODELS],
    });
  }

  return NextResponse.json({ success: true });
}
