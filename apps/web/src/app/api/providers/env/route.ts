import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Map of model provider IDs to their environment variable names
// Uses MODEL_* prefix to distinguish from embedding provider keys
const PROVIDER_ENV_MAP: Record<string, { keyVar?: string; urlVar?: string }> = {
  openai: { keyVar: "MODEL_OPENAI_API_KEY" },
  anthropic: { keyVar: "MODEL_ANTHROPIC_API_KEY" },
  google: { keyVar: "MODEL_GOOGLE_API_KEY" },
  groq: { keyVar: "MODEL_GROQ_API_KEY" },
  ollama: { urlVar: "MODEL_OLLAMA_URL" },
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get environment variable defaults for model providers
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
