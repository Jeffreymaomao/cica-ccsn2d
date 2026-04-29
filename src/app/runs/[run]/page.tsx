import Link from "next/link";
import { notFound } from "next/navigation";

import { FramePlayer, type PlayerPayload } from "@/components/frame-player";
import { formatDate, getPlayerData, isPublicRun, listRuns } from "@/lib/chiral";

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

  const runs = await listRuns();
  const runSummary = runs.find((entry) => entry.name === run);
  if (!runSummary) {
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-10">
      <div className="rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-6 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/" className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--color-link)]">
              Back to runs
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-white">{run}</h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Public fields from <code className="font-mono text-[var(--color-paper)]">frames/{`{field}`}</code>
              , aligned against <code className="font-mono text-[var(--color-paper)]">times.dat</code>.
            </p>
          </div>
          <div className="grid gap-2 rounded-2xl border border-[var(--color-line)] bg-black/15 p-4 text-sm">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Run summary
            </div>
            <div className="text-white">{runSummary.fieldCount} public fields</div>
            <div className="text-white">{runSummary.publicFrameCount} public frames</div>
            <div className="text-[var(--color-muted)]">Updated {formatDate(runSummary.modifiedAt)}</div>
          </div>
        </div>
      </div>

      <FramePlayer initialData={initialData} />
    </main>
  );
}
