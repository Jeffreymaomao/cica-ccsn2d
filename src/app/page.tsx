import Link from "next/link";

import { ensureChiralRoot, formatDate, listRuns } from "@/lib/chiral";

export default async function Home() {
  await ensureChiralRoot();
  const runs = await listRuns();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 sm:px-10">
      <section className="rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="flex flex-col gap-4 border-b border-[var(--color-line)] pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--color-link)]">
            Chiral Frames Player
          </p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Browse public <span className="text-[var(--color-accent)]">*_B*</span> simulation runs
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                Each run exposes only its
                <code className="mx-1 font-mono text-[var(--color-paper)]">frames/{`{field}`}</code>
                images and
                <code className="mx-1 font-mono text-[var(--color-paper)]">times.dat</code>
                timeline. Everything else stays private.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--color-line)] bg-black/15 p-4 text-sm">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Runs
                </div>
                <div className="mt-1 text-2xl font-semibold text-white">{runs.length}</div>
              </div>
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  API
                </div>
                <div className="mt-1 text-sm text-[var(--color-success)]">/api/player</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {runs.map((run) => (
            <Link
              key={run.name}
              href={`/runs/${encodeURIComponent(run.name)}`}
              className="group rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-5 transition duration-150 hover:border-[var(--color-link)] hover:bg-slate-900/90"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-white group-hover:text-[var(--color-link)]">
                    {run.name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Updated {formatDate(run.modifiedAt)}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-accent-soft)] px-3 py-1 font-mono text-[var(--color-accent)]">
                    {run.fieldCount} fields
                  </span>
                  <span className="rounded-full border border-[var(--color-line)] bg-black/20 px-3 py-1 font-mono text-[var(--color-paper)]">
                    {run.publicFrameCount} public frames
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
