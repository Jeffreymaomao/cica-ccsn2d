import { notFound } from "next/navigation";

import { FramePlayer, type PlayerPayload } from "@/components/frame-player";
import { formatRunTag, formatRunTime, getPlayerData, isPublicRun, parseNameToTag } from "@/lib/chiral";

type RunPageProps = {
  params: Promise<{ run: string }>;
  searchParams: Promise<{ field?: string }>;
};

export default async function RunPage({ params, searchParams }: RunPageProps) {
  const { run } = await params;
  const { field } = await searchParams;

  if (!isPublicRun(run)) {
    notFound();
  }

  let playerData;
  try {
    playerData = await getPlayerData(run, field);
  } catch {
    notFound();
  }

  const initialData: PlayerPayload = {
    run: playerData.run,
    selectedField: playerData.selectedField,
    fields: playerData.fields,
    frameCount: playerData.frames.length,
    totalImages: playerData.totalImages,
    totalTimes: playerData.totalTimes,
    frames: playerData.frames.map((frame) => ({
      index: frame.index,
      fileName: frame.fileName,
      timeSeconds: frame.timeSeconds,
      currentTimeSeconds: frame.currentTimeSeconds,
      timeSinceBounceSeconds: frame.timeSinceBounceSeconds,
      imageUrl: `/api/frame?run=${encodeURIComponent(run)}&field=${encodeURIComponent(playerData.selectedField)}&index=${frame.index}`,
    })),
  };
  const meta = parseNameToTag(run);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-4 sm:px-6">
      <FramePlayer
        initialData={initialData}
        runName={run}
        runTitle={formatRunTag(meta)}
        startTime={formatRunTime(meta.time)}
      />
    </main>
  );
}
