import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Generic directory browsing is disabled. Use /api/runs or /api/player." },
    { status: 403 },
  );
}
