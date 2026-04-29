import Link from "next/link";

import { ensureChiralRoot, formatDate, formatRunTag, formatRunTime, listRuns, parseNameToTag } from "@/lib/chiral";

export default async function Home() {
  await ensureChiralRoot();
  const runs = await listRuns();
  const runsWithMeta = runs.map((run) => ({
    ...run,
    meta: parseNameToTag(run.name),
  }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 sm:px-10">
      <section className="rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-8">
        <div className="flex flex-col gap-5 border-b border-[var(--color-line)] px-4 pb-4 pt-6">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--color-link)]">
            Chiral Frames Player
          </p>
          <div className="flex flex-col gap-5">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-semibold text-white sm:text-5xl">
                <span className="text-[var(--color-accent)]">Chiral</span> simulation
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
                Public frame sets sorted by run name, with simulation start time and latest file update.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 grid gap-4">
          {runsWithMeta.map((run) => (
            <Link
              key={run.name}
              href={`/runs/${encodeURIComponent(run.name)}`}
              className="group rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5 transition duration-150 hover:border-[var(--color-link)] hover:bg-slate-900/90"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-white group-hover:text-[var(--color-link)]">
                    {formatRunTag(run.meta)}
                  </h2>
                  <p className="mt-1 font-mono text-sm text-[var(--color-muted)]">
                    Start {formatRunTime(run.meta.time)}
                  </p>
                  <p className="mt-1 font-mono text-sm text-[var(--color-muted)]">
                    Update {formatDate(run.modifiedAt)}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-accent-soft)] px-3 py-1 font-mono text-[var(--color-accent)]">
                    {run.fieldCount} fields
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {runs.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[var(--color-line)] p-8 text-sm text-[var(--color-muted)]">
              No public <code className="font-mono">*_B*</code> runs were found under the configured chiral root.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
