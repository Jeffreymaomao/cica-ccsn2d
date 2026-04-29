import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Generic file previews are disabled. Use /api/player or /api/frame." },
    { status: 403 },
  );
}
