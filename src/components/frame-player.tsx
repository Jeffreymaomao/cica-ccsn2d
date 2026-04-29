"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type PlayerField = {
  name: string;
  frameCount: number;
};

type PlayerFrame = {
  index: number;
  fileName: string;
  imageUrl: string;
  timeSeconds: number | null;
  currentTimeSeconds: number | null;
  timeSinceBounceSeconds: number | null;
};

export type PlayerPayload = {
  run: string;
  selectedField: string;
  fields: PlayerField[];
  frameCount: number;
  totalImages: number;
  totalTimes: number;
  frames: PlayerFrame[];
};

type FramePlayerProps = {
  initialData: PlayerPayload;
};

function formatSeconds(value: number | null) {
  return value === null ? "n/a" : `${value.toFixed(6)} s`;
}

export function FramePlayer({ initialData }: FramePlayerProps) {
  const [playerData, setPlayerData] = useState(initialData);
  const [selectedField, setSelectedField] = useState(initialData.selectedField);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoadingField, setIsLoadingField] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadField() {
      if (selectedField === playerData.selectedField) {
        return;
      }

      setIsLoadingField(true);
      try {
        const response = await fetch(
          `/api/player?run=${encodeURIComponent(initialData.run)}&field=${encodeURIComponent(selectedField)}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to load field ${selectedField}`);
        }

        const nextData = (await response.json()) as PlayerPayload;
        if (!cancelled) {
          setPlayerData(nextData);
          setSelectedIndex(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingField(false);
        }
      }
    }

    void loadField();
    return () => {
      cancelled = true;
    };
  }, [initialData.run, playerData.selectedField, selectedField]);

  const frames = playerData.frames;
  const activeFrame = frames[selectedIndex] ?? null;
  const maxIndex = Math.max(0, frames.length - 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {playerData.fields.map((field) => (
          <button
            key={field.name}
            type="button"
            onClick={() => setSelectedField(field.name)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              field.name === playerData.selectedField
                ? "border-[var(--color-link)] bg-sky-400/10 text-[var(--color-link)]"
                : "border-[var(--color-line)] bg-black/15 text-[var(--color-paper)] hover:border-[var(--color-link)]"
            }`}
          >
            {field.name} <span className="font-mono text-xs opacity-70">{field.frameCount}</span>
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-4 shadow-2xl shadow-black/20">
        <div className="flex min-h-[60vh] max-h-[90vh] items-center justify-center overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-black/30">
          {activeFrame ? (
            <Image
              key={activeFrame.imageUrl}
              src={activeFrame.imageUrl}
              alt={`${playerData.selectedField} frame ${activeFrame.index}`}
              width={1600}
              height={1000}
              unoptimized
              className="h-auto max-h-[90vh] w-auto max-w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-muted)]">
              No public frames available for this field.
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {playerData.selectedField}
              {isLoadingField ? <span className="ml-2 text-sm text-[var(--color-muted)]">loading...</span> : null}
            </h2>
            <p className="mt-1 font-mono text-sm text-[var(--color-muted)]">
              {activeFrame ? activeFrame.fileName : "No frame selected"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedIndex((current) => Math.max(0, current - 1))}
              disabled={selectedIndex === 0 || frames.length === 0}
              className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-paper)] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setSelectedIndex((current) => Math.min(maxIndex, current + 1))}
              disabled={selectedIndex >= maxIndex || frames.length === 0}
              className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-paper)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[var(--color-line)] bg-black/15 p-4">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Frame</div>
            <div className="mt-2 text-xl text-white">
              {frames.length === 0 ? "0 / 0" : `${selectedIndex + 1} / ${frames.length}`}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--color-line)] bg-black/15 p-4">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Current time</div>
            <div className="mt-2 text-sm text-white">
              {activeFrame ? formatSeconds(activeFrame.currentTimeSeconds) : "n/a"}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--color-line)] bg-black/15 p-4">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">t - tbounce</div>
            <div className="mt-2 text-sm text-white">
              {activeFrame ? formatSeconds(activeFrame.timeSinceBounceSeconds) : "n/a"}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--color-line)] bg-black/15 p-4">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Visible subset</div>
            <div className="mt-2 text-sm text-white">
              {playerData.frameCount} frames from {playerData.totalImages} images / {playerData.totalTimes} times
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
            <span>Timeline</span>
            <span>{activeFrame ? formatSeconds(activeFrame.timeSeconds) : "n/a"}</span>
          </div>
          <input
            type="range"
            min={0}
            max={maxIndex}
            step={1}
            value={Math.min(selectedIndex, maxIndex)}
            disabled={frames.length === 0}
            onChange={(event) => setSelectedIndex(Number.parseInt(event.target.value, 10))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-sky-300"
          />
          <div className="mt-2 flex justify-between font-mono text-xs text-[var(--color-muted)]">
            <span>0</span>
            <span>{maxIndex}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
