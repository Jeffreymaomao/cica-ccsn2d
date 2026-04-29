import { NextRequest, NextResponse } from "next/server";

import { readTimesFile } from "@/lib/chiral";

export async function GET(request: NextRequest) {
  const run = request.nextUrl.searchParams.get("run");
  const asset = request.nextUrl.searchParams.get("asset");

  if (!run || asset !== "times.dat") {
    return NextResponse.json({ error: "Only times.dat is public" }, { status: 403 });
  }

  try {
    const file = await readTimesFile(run);
    return new NextResponse(file.buffer, {
      headers: {
        "content-type": file.mimeType,
        "content-disposition": `attachment; filename="${file.fileName}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download asset" },
      { status: 400 },
    );
  }
}
