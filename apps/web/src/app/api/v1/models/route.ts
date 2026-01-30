import { NextResponse } from "next/server";
import { PROVIDER_MODELS } from "@nodehub/core/providers";

export async function GET() {
  const allModels = Object.entries(PROVIDER_MODELS).flatMap(([provider, models]) =>
    models.map((model) => ({
      id: model,
      object: "model",
      created: Math.floor(Date.now() / 1000),
      owned_by: provider,
    }))
  );

  return NextResponse.json({
    object: "list",
    data: allModels,
  });
}
