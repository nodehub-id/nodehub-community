import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, embeddingProviderConfig } from "@nodehub/db";
import { eq } from "drizzle-orm";

// GET: Fetch user's embedding provider configuration
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await db.query.embeddingProviderConfig.findFirst({
        where: eq(embeddingProviderConfig.userId, session.user.id),
    });

    if (!config) {
        // Return default config (local provider, not configured yet)
        return NextResponse.json({
            provider: "local",
            model: "Xenova/all-MiniLM-L6-v2",
            isConfigured: false,
            enabled: true,
        });
    }

    return NextResponse.json({
        provider: config.provider,
        baseUrl: config.baseUrl,
        model: config.model,
        dimensions: config.dimensions,
        isConfigured: config.isConfigured,
        enabled: config.enabled,
    });
}

// POST: Save user's embedding provider configuration
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { provider, apiKey, baseUrl, model, enabled } = body;

    if (!provider) {
        return NextResponse.json(
            { error: "Provider is required" },
            { status: 400 }
        );
    }

    const existing = await db.query.embeddingProviderConfig.findFirst({
        where: eq(embeddingProviderConfig.userId, session.user.id),
    });

    const data = {
        provider,
        apiKey: apiKey || existing?.apiKey,
        baseUrl: baseUrl || null,
        model: model || null,
        enabled: enabled ?? true,
        isConfigured: true,
        updatedAt: new Date(),
    };

    if (existing) {
        await db
            .update(embeddingProviderConfig)
            .set(data)
            .where(eq(embeddingProviderConfig.id, existing.id));
    } else {
        await db.insert(embeddingProviderConfig).values({
            userId: session.user.id,
            ...data,
        });
    }

    return NextResponse.json({ success: true });
}
