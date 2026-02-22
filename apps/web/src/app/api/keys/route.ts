import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserApiKeys, countUserApiKeys, createApiKey, revokeApiKey } from "@nodehub/core/auth";
import { createApiKeySchema } from "@nodehub/shared/validation";

// Community Edition: 3 API keys allowed
const MAX_API_KEYS = 3;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await getUserApiKeys(session.user.id);
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user already has max keys
  const keyCount = await countUserApiKeys(session.user.id);
  if (keyCount >= MAX_API_KEYS) {
    return NextResponse.json(
      { 
        error: "Community Edition allows up to 3 API keys",
        message: "Upgrade to Full Edition for unlimited keys"
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const result = createApiKeySchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.errors },
      { status: 400 }
    );
  }

  try {
    const key = await createApiKey(session.user.id, result.data.name);
    return NextResponse.json({ key, name: result.data.name }, { status: 201 });
  } catch (error) {
    console.error("Failed to create API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}
