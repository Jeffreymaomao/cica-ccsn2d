import { NextRequest, NextResponse } from "next/server";

import { getPlayerData } from "@/lib/chiral";

export async function GET(request: NextRequest) {
  const run = request.nextUrl.searchParams.get("run");
  const field = request.nextUrl.searchParams.get("field");

  if (!run) {
    return NextResponse.json({ error: "Missing run parameter" }, { status: 400 });
  }

  try {
    const data = await getPlayerData(run, field);
    const frames = data.frames.map((frame) => ({
      index: frame.index,
      fileName: frame.fileName,
      timeSeconds: frame.timeSeconds,
      currentTimeSeconds: frame.currentTimeSeconds,
      timeSinceBounceSeconds: frame.timeSinceBounceSeconds,
      imageUrl: `/api/frame?run=${encodeURIComponent(run)}&field=${encodeURIComponent(data.selectedField)}&index=${frame.index}`,
    }));

    return NextResponse.json({
      run: data.run,
      selectedField: data.selectedField,
      fields: data.fields,
      frameCount: frames.length,
      totalImages: data.totalImages,
      totalTimes: data.totalTimes,
      frames,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load player data" },
      { status: 400 },
    );
  }
}
