import { NextRequest, NextResponse } from "next/server";
import { PROVIDER_MODELS } from "@nodehub/core/providers";
import { validateApiKey } from "@nodehub/core/auth";
import { db, modelProviderConfigs } from "@nodehub/db";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  // Get hardcoded cloud provider models
  const allModels = Object.entries(PROVIDER_MODELS).flatMap(([provider, models]) =>
    models.map((model) => ({
      id: model,
      object: "model" as const,
      created: Math.floor(Date.now() / 1000),
      owned_by: provider,
    }))
  );

  // Try to get user ID from API key for Ollama models
  const authHeader = req.headers.get("authorization");
  let userId: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = authHeader.slice(7);
    const keyData = await validateApiKey(apiKey);
    if (keyData) {
      userId = keyData.userId;
    }
  }

  // Fetch Ollama models dynamically if we have a user
  if (userId) {
    try {
      const ollamaConfig = await db.query.modelProviderConfigs.findFirst({
        where: and(
          eq(modelProviderConfigs.userId, userId),
          eq(modelProviderConfigs.providerId, "ollama"),
          eq(modelProviderConfigs.enabled, true)
        ),
      });

      if (ollamaConfig) {
        const baseUrl = ollamaConfig.baseUrl || "http://localhost:11434";
        const ollamaResponse = await fetch(`${baseUrl}/api/tags`);
        if (ollamaResponse.ok) {
          const ollamaData = await ollamaResponse.json() as { models?: Array<{ name: string }> };
          const ollamaModels = ollamaData.models?.map((m) => ({
            id: m.name,
            object: "model" as const,
            created: Math.floor(Date.now() / 1000),
            owned_by: "ollama",
          })) || [];
          allModels.push(...ollamaModels);
        }
      }
    } catch {
      // Ignore Ollama fetch errors
    }
  }

  return NextResponse.json({
    object: "list",
    data: allModels,
  });
}
