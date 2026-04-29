"use client";

import Image from "next/image";
import Link from "next/link";
import type { PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

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
  runName: string;
  runTitle: string;
  startTime: string;
};

function formatSeconds(value: number | null) {
  return value === null ? "n/a" : `${value.toFixed(6)} s`;
}

type SwipeStart = {
  x: number;
  y: number;
};

export function FramePlayer({ initialData, runName, runTitle, startTime }: FramePlayerProps) {
  const [playerData, setPlayerData] = useState(initialData);
  const [selectedField, setSelectedField] = useState(initialData.selectedField);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoadingField, setIsLoadingField] = useState(false);
  const swipeStart = useRef<SwipeStart | null>(null);

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
  const previousFrame = frames[selectedIndex - 1] ?? null;
  const nextFrame = frames[selectedIndex + 1] ?? null;
  const maxIndex = Math.max(0, frames.length - 1);
  const canGoPrevious = selectedIndex > 0 && frames.length > 0;
  const canGoNext = selectedIndex < maxIndex && frames.length > 0;

  function goToPrevious() {
    setSelectedIndex((current) => Math.max(0, current - 1));
  }

  function goToNext() {
    setSelectedIndex((current) => Math.min(maxIndex, current + 1));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
      return;
    }

    swipeStart.current = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) {
      return;
    }

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX > 0) {
      goToPrevious();
      return;
    }

    goToNext();
  }

  function renderFrame(
    frame: PlayerFrame | null,
    label: string,
    priority = false,
    imageClassName = "h-auto max-h-full w-auto max-w-full object-contain",
  ) {
    if (!frame) {
      return (
        <div className="flex h-full min-h-0 items-center justify-center rounded-[1rem] border border-dashed border-[var(--color-line)] bg-black/20 px-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
          {label}
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 items-center justify-center overflow-hidden rounded-[1rem] border border-[var(--color-line)] bg-black/30">
        <Image
          key={frame.imageUrl}
          src={frame.imageUrl}
          alt={`${playerData.selectedField} frame ${frame.index}`}
          width={1600}
          height={1000}
          priority={priority}
          unoptimized
          className={imageClassName}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex h-[calc(100svh-2rem)] min-h-[36rem] flex-col gap-3">
        <header className="sticky top-0 z-20 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-link)]">
                Back to runs
              </Link>
              <h1 className="mt-1 truncate text-2xl font-semibold text-white sm:text-3xl">
                {runTitle}
              </h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-[var(--color-muted)]">
                <span>Start {startTime}</span>
                <span className="truncate">{runName}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {playerData.fields.map((field) => (
                <button
                  key={field.name}
                  type="button"
                  onClick={() => setSelectedField(field.name)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    field.name === playerData.selectedField
                      ? "border-[var(--color-link)] bg-sky-400/10 text-[var(--color-link)]"
                      : "border-[var(--color-line)] bg-black/15 text-[var(--color-paper)] hover:border-[var(--color-link)]"
                  }`}
                >
                  {field.name} <span className="font-mono text-xs opacity-70">{field.frameCount}</span>
                </button>
              ))}
              {isLoadingField ? (
                <span className="font-mono text-xs text-[var(--color-muted)]">loading...</span>
              ) : null}
            </div>
          </div>
        </header>

        <div
          className="grid min-h-0 flex-1 touch-pan-y gap-2 overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-2 shadow-2xl shadow-black/20 lg:grid-cols-[minmax(160px,0.42fr)_minmax(0,1fr)_minmax(160px,0.42fr)] lg:grid-rows-[minmax(0,1fr)]"
          onPointerDown={handlePointerDown}
          onPointerCancel={() => {
            swipeStart.current = null;
          }}
          onPointerUp={handlePointerUp}
        >
          <button
            type="button"
            onClick={goToPrevious}
            disabled={!canGoPrevious}
            className="hidden h-full min-h-0 cursor-pointer overflow-hidden rounded-[1rem] text-left transition hover:border-[var(--color-link)] disabled:cursor-default disabled:opacity-45 lg:block"
            aria-label="Previous frame"
          >
            {renderFrame(
              previousFrame,
              "No previous frame",
              false,
              "h-full max-h-full w-auto max-w-none object-contain",
            )}
          </button>

          <div className="relative min-h-[calc(100svh-12rem)] overflow-hidden lg:h-full lg:min-h-0">
            {renderFrame(activeFrame, "No public frames available", true)}
            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
              <div className="min-w-0 rounded-full border border-[var(--color-line)] bg-black/45 px-3 py-1 font-mono text-xs text-[var(--color-paper)] backdrop-blur">
                {frames.length === 0 ? "0 / 0" : `${selectedIndex + 1} / ${frames.length}`}
              </div>
              <div className="hidden max-w-[60%] truncate rounded-full border border-[var(--color-line)] bg-black/45 px-3 py-1 font-mono text-xs text-[var(--color-muted)] backdrop-blur sm:block">
                {activeFrame ? activeFrame.fileName : "No frame selected"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={goToNext}
            disabled={!canGoNext}
            className="hidden h-full min-h-0 cursor-pointer overflow-hidden rounded-[1rem] text-left transition hover:border-[var(--color-link)] disabled:cursor-default disabled:opacity-45 lg:block"
            aria-label="Next frame"
          >
            {renderFrame(
              nextFrame,
              "No next frame",
              false,
              "h-full max-h-full w-auto max-w-none object-contain",
            )}
          </button>

          <div className="flex items-center justify-between gap-2 lg:hidden">
            <button
              type="button"
              onClick={goToPrevious}
              disabled={!canGoPrevious}
              className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-paper)] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={goToNext}
              disabled={!canGoNext}
              className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-paper)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-[var(--color-line)] bg-black/15 p-3">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Frame</div>
            <div className="mt-1 text-lg text-white">
              {frames.length === 0 ? "0 / 0" : `${selectedIndex + 1} / ${frames.length}`}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-black/15 p-3">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Current time</div>
            <div className="mt-1 text-sm text-white">
              {activeFrame ? formatSeconds(activeFrame.currentTimeSeconds) : "n/a"}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-black/15 p-3">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">t - tbounce</div>
            <div className="mt-1 text-sm text-white">
              {activeFrame ? formatSeconds(activeFrame.timeSinceBounceSeconds) : "n/a"}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-black/15 p-3">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Visible subset</div>
            <div className="mt-1 text-sm text-white">
              {playerData.frameCount} frames from {playerData.totalImages} images / {playerData.totalTimes} times
            </div>
          </div>
        </div>

        <div className="mt-4">
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
