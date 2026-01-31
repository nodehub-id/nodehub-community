import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Map of provider IDs to their environment variable names
const PROVIDER_ENV_MAP: Record<string, { keyVar?: string; urlVar?: string }> = {
  openai: { keyVar: "OPENAI_API_KEY" },
  anthropic: { keyVar: "ANTHROPIC_API_KEY" },
  google: { keyVar: "GOOGLE_API_KEY" },
  groq: { keyVar: "GROQ_API_KEY" },
  ollama: { urlVar: "OLLAMA_BASE_URL" },
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get environment variable defaults for providers
  const envDefaults: Record<string, { apiKey?: string; baseUrl?: string }> = {};

  for (const [providerId, vars] of Object.entries(PROVIDER_ENV_MAP)) {
    envDefaults[providerId] = {};
    
    if (vars.keyVar && process.env[vars.keyVar]) {
      envDefaults[providerId].apiKey = process.env[vars.keyVar];
    }
    
    if (vars.urlVar && process.env[vars.urlVar]) {
      envDefaults[providerId].baseUrl = process.env[vars.urlVar];
    }
  }

  return NextResponse.json({ envDefaults });
}
