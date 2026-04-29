import { NextRequest, NextResponse } from "next/server";

import { readFrameImage } from "@/lib/chiral";

export async function GET(request: NextRequest) {
  const run = request.nextUrl.searchParams.get("run");
  const field = request.nextUrl.searchParams.get("field");
  const index = Number.parseInt(request.nextUrl.searchParams.get("index") ?? "", 10);

  if (!run || !field || !Number.isInteger(index)) {
    return NextResponse.json(
      { error: "Missing run, field, or index parameter" },
      { status: 400 },
    );
  }

  try {
    const image = await readFrameImage(run, field, index);
    return new NextResponse(image.buffer, {
      headers: {
        "content-type": image.mimeType,
        "content-disposition": `inline; filename="${image.fileName}"`,
        "cache-control": "public, max-age=60",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load frame image" },
      { status: 400 },
    );
  }
}
