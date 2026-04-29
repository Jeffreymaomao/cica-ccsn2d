import { NextResponse } from "next/server";

import { listRuns } from "@/lib/chiral";

export async function GET() {
  try {
    const runs = await listRuns();
    return NextResponse.json({ runs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list runs" },
      { status: 500 },
    );
  }
}
