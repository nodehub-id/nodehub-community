import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@nodehub/core/auth";
import { z } from "zod";

const embeddingsSchema = z.object({
  model: z.string(),
  input: z.union([z.string(), z.array(z.string())]),
});

export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const parsed = embeddingsSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid request", type: "invalid_request_error" } },
        { status: 400 }
      );
    }

    // For now, return a placeholder response
    // Full embeddings implementation would require OpenAI API integration
    const input = Array.isArray(parsed.data.input) ? parsed.data.input : [parsed.data.input];
    
    return NextResponse.json({
      object: "list",
      data: input.map((text, i) => ({
        object: "embedding",
        index: i,
        embedding: [], // Would be actual embedding vector
      })),
      model: parsed.data.model,
      usage: {
        prompt_tokens: input.join(" ").split(" ").length,
        total_tokens: input.join(" ").split(" ").length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: "Internal server error", type: "api_error" } },
      { status: 500 }
    );
  }
}
