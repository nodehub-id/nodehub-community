import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeApiKey } from "@nodehub/core/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  
  const success = await revokeApiKey(id, session.user.id);
  
  if (!success) {
    return NextResponse.json(
      { error: "API key not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
