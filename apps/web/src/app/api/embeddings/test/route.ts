import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createEmbeddingProvider } from "@nodehub/core/cache";

// POST: Test embedding provider connection
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { provider, apiKey, baseUrl, model } = body;

    if (!provider) {
        return NextResponse.json(
            { error: "Provider is required" },
            { status: 400 }
        );
    }

    try {
        // Create a temporary provider instance with the given config
        const embeddingProvider = createEmbeddingProvider({
            provider,
            apiKey,
            baseUrl,
            model,
        });

        if (!embeddingProvider.isEnabled()) {
            return NextResponse.json({
                success: false,
                error: "Provider is not properly configured. Check your settings.",
            });
        }

        // Generate a test embedding
        const testText = "This is a test query to verify the embedding provider connection.";
        const startTime = Date.now();
        const embedding = await embeddingProvider.generateEmbedding(testText);
        const latencyMs = Date.now() - startTime;

        if (!embedding) {
            return NextResponse.json({
                success: false,
                error: "Failed to generate embedding. Check your configuration.",
            });
        }

        return NextResponse.json({
            success: true,
            dimensions: embedding.length,
            latencyMs,
            provider: embeddingProvider.name,
        });
    } catch (error: any) {
        console.error("[EmbeddingTest] Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Unknown error occurred",
        });
    }
}
