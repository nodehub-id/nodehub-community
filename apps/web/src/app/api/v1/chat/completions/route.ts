import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@nodehub/core/auth";
import { SemanticCache } from "@nodehub/core/cache";
import { createProvider, PROVIDER_MODELS } from "@nodehub/core/providers";
import { maybeRunCleanup, getCleanupConfigFromEnv } from "@nodehub/core/cleanup";
import { db, modelProviderConfigs, requestLogs } from "@nodehub/db";
import { eq, and } from "drizzle-orm";
import { chatCompletionSchema } from "@nodehub/shared/validation";
import { z } from "zod";


export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // Probabilistic cleanup (non-blocking, ~1% of requests)
  maybeRunCleanup(getCleanupConfigFromEnv());

  // 1. Validate API key
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: { message: "Missing authorization header", type: "authentication_error" } },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7);
  const keyData = await validateApiKey(apiKey);

  if (!keyData) {
    return NextResponse.json(
      { error: { message: "Invalid API key", type: "authentication_error" } },
      { status: 401 }
    );
  }

  try {
    // 2. Parse and validate request
    const body = await req.json();
    const parsed = chatCompletionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid request", type: "invalid_request_error", details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const validated = parsed.data;

    // 3. Check cache
    const cache = new SemanticCache({ similarityThreshold: 0.95, ttlHours: 24 });
    const query = JSON.stringify(validated.messages);
    const cached = await cache.get(keyData.userId, query, validated.model);

    if (cached && cached.hit) {
      // Log cache hit
      await db.insert(requestLogs).values({
        userId: keyData.userId,
        apiKeyId: keyData.keyId,
        providerId: "cache",
        model: validated.model,
        promptTokens: 0,
        completionTokens: 0,
        cost: 0,
        cacheHit: 1,
        durationMs: Date.now() - startTime,
        status: "success",
      });

      return NextResponse.json({
        id: `cached-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: validated.model,
        choices: [{
          index: 0,
          message: { role: "assistant", content: cached.response },
          finish_reason: "stop",
        }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        nodehub: {
          cache_hit: true,
          cache_type: cached.hitType, // 'exact' or 'semantic'
          similarity: cached.similarity,
        },
      });
    }

    // 4. Find provider for model
    let providerType: string | null = null;
    for (const [type, models] of Object.entries(PROVIDER_MODELS)) {
      if (models.includes(validated.model)) {
        providerType = type;
        break;
      }
    }

    // If no provider found, check if user has Ollama configured with this model
    if (!providerType) {
      const ollamaConfig = await db.query.modelProviderConfigs.findFirst({
        where: and(
          eq(modelProviderConfigs.userId, keyData.userId),
          eq(modelProviderConfigs.providerId, "ollama"),
          eq(modelProviderConfigs.enabled, true)
        ),
      });

      if (ollamaConfig) {
        // Verify model exists in Ollama
        const baseUrl = ollamaConfig.baseUrl || "http://localhost:11434";
        try {
          const ollamaResponse = await fetch(`${baseUrl}/api/tags`);
          if (ollamaResponse.ok) {
            const ollamaData = await ollamaResponse.json() as { models?: Array<{ name: string }> };
            const availableModels = ollamaData.models?.map((m) => m.name) || [];
            if (availableModels.includes(validated.model)) {
              providerType = "ollama";
            }
          }
        } catch {
          // Ollama not reachable, ignore
        }
      }
    }

    if (!providerType) {
      return NextResponse.json(
        { error: { message: `Model ${validated.model} not supported`, type: "invalid_request_error" } },
        { status: 400 }
      );
    }

    // 5. Get provider configuration
    const providerConfig = await db.query.modelProviderConfigs.findFirst({
      where: and(
        eq(modelProviderConfigs.userId, keyData.userId),
        eq(modelProviderConfigs.providerId, providerType),
        eq(modelProviderConfigs.enabled, true)
      ),
    });


    if (!providerConfig || !providerConfig.apiKey) {
      return NextResponse.json(
        { error: { message: `Provider ${providerType} not configured`, type: "invalid_request_error" } },
        { status: 400 }
      );
    }

    // 6. Route to provider
    const provider = createProvider(providerType as any, {
      id: providerConfig.id,
      name: providerType,
      apiKey: providerConfig.apiKey,
      baseUrl: providerConfig.baseUrl || undefined,
      models: providerConfig.models as string[] || [],
    });

    // 7. Call provider
    if (validated.stream) {
      // Handle streaming
      const stream = new ReadableStream({
        async start(controller) {
          let fullResponse = "";
          const usage = { prompt: 0, completion: 0 };

          try {
            for await (const chunk of provider.chatCompletions(validated)) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));

              if (chunk.choices?.[0]?.message?.content) {
                fullResponse += chunk.choices[0].message.content;
              }
              if (chunk.usage) {
                usage.prompt = chunk.usage.prompt_tokens || 0;
                usage.completion = chunk.usage.completion_tokens || 0;
              }
            }

            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            controller.close();

            // Cache the response
            await cache.set(keyData.userId, query, validated.model, fullResponse, usage);
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    } else {
      // Non-streaming
      let response: any;
      for await (const chunk of provider.chatCompletions(validated)) {
        response = chunk;
      }

      // Cache response
      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;

      await cache.set(
        keyData.userId,
        query,
        validated.model,
        response.choices?.[0]?.message?.content || "",
        { prompt: promptTokens, completion: completionTokens }
      );

      // Log request
      const cost = provider.calculateCost(validated.model, promptTokens, completionTokens);
      await db.insert(requestLogs).values({
        userId: keyData.userId,
        apiKeyId: keyData.keyId,
        providerId: providerType,
        model: validated.model,
        promptTokens,
        completionTokens,
        cost,
        cacheHit: 0,
        durationMs: Date.now() - startTime,
        status: "success",
      });

      return NextResponse.json({
        ...response,
        nodehub: { cache_hit: false },
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const errorType = statusCode === 429 ? "rate_limit_error" : statusCode >= 400 && statusCode < 500 ? "invalid_request_error" : "api_error";
    return NextResponse.json(
      { error: { message: errorMessage, type: errorType } },
      { status: statusCode }
    );
  }
}
