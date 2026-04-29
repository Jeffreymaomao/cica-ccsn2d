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

type SlideDirection = "previous" | "next" | null;

export function FramePlayer({ initialData, runName, runTitle, startTime }: FramePlayerProps) {
  const [playerData, setPlayerData] = useState(initialData);
  const [selectedField, setSelectedField] = useState(initialData.selectedField);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoadingField, setIsLoadingField] = useState(false);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const activeFrameRef = useRef<HTMLButtonElement | null>(null);
  const swipeStart = useRef<SwipeStart | null>(null);
  const slideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          if (slideTimeoutRef.current) {
            clearTimeout(slideTimeoutRef.current);
            slideTimeoutRef.current = null;
          }
          setSlideDirection(null);
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

  useEffect(() => {
    return () => {
      if (slideTimeoutRef.current) {
        clearTimeout(slideTimeoutRef.current);
      }
    };
  }, []);

  const frames = playerData.frames;
  const activeFrame = frames[selectedIndex] ?? null;
  const maxIndex = Math.max(0, frames.length - 1);
  const canGoPrevious = selectedIndex > 0 && frames.length > 0;
  const canGoNext = selectedIndex < maxIndex && frames.length > 0;
  const visibleStartIndex =
    frames.length <= 3 ? 0 : Math.min(Math.max(selectedIndex - 1, 0), frames.length - 3);
  const visibleFrames = frames.slice(visibleStartIndex, visibleStartIndex + 3);
  const activePosition = Math.max(0, selectedIndex - visibleStartIndex);

  useEffect(() => {
    const element = activeFrameRef.current;
    if (!element) {
      return;
    }

    function updateSlideWidth() {
      setSlideWidth(element!.getBoundingClientRect().width);
    }

    updateSlideWidth();
    const resizeObserver = new ResizeObserver(updateSlideWidth);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeFrame?.imageUrl, playerData.selectedField]);

  function finishSlide(nextIndex: number) {
    slideTimeoutRef.current = setTimeout(() => {
      setSelectedIndex(nextIndex);
      setSlideDirection(null);
      slideTimeoutRef.current = null;
    }, 260);
  }

  function goToPrevious() {
    if (!canGoPrevious || slideDirection) {
      return;
    }

    if (slideTimeoutRef.current) {
      clearTimeout(slideTimeoutRef.current);
    }

    setSlideDirection("previous");
    finishSlide(selectedIndex - 1);
  }

  function goToNext() {
    if (!canGoNext || slideDirection) {
      return;
    }

    if (slideTimeoutRef.current) {
      clearTimeout(slideTimeoutRef.current);
    }

    setSlideDirection("next");
    finishSlide(selectedIndex + 1);
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

  const baseSlideOffset = -activePosition * slideWidth;
  const slideOffset =
    slideDirection === "next"
      ? baseSlideOffset - slideWidth
      : slideDirection === "previous"
        ? baseSlideOffset + slideWidth
        : baseSlideOffset;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex h-[calc(100svh-2rem)] min-h-[36rem] flex-col gap-3">
        <header className="sticky top-0 z-20 border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur">
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
          className="relative flex min-h-0 flex-1 touch-pan-y overflow-hidden rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] shadow-2xl shadow-black/20"
          onPointerDown={handlePointerDown}
          onPointerCancel={() => {
            swipeStart.current = null;
          }}
          onPointerUp={handlePointerUp}
        >
          <div
            className="flex h-full min-h-0 shrink-0 items-stretch will-change-transform"
            style={{
              transform: `translate3d(${slideOffset}px, 0, 0)`,
              transition: slideDirection ? "transform 260ms ease-out" : "none",
            }}
          >
            {visibleFrames.length > 0 ? (
              visibleFrames.map((frame) => {
                const isActive = frame.index === selectedIndex;

                return (
                  <button
                    key={frame.imageUrl}
                    ref={isActive ? activeFrameRef : null}
                    type="button"
                    onClick={() => {
                      if (frame.index < selectedIndex) {
                        goToPrevious();
                        return;
                      }

                      if (frame.index > selectedIndex) {
                        goToNext();
                      }
                    }}
                    className="relative h-full min-h-[calc(100svh-12rem)] shrink-0 cursor-pointer overflow-hidden text-left lg:min-h-0"
                    aria-label={isActive ? "Current frame" : frame.index < selectedIndex ? "Previous frame" : "Next frame"}
                  >
                    <div className="flex h-full min-h-0 shrink-0 items-center justify-center overflow-hidden bg-black/30">
                      <Image
                        key={frame.imageUrl}
                        src={frame.imageUrl}
                        alt={`${playerData.selectedField} frame ${frame.index}`}
                        width={1600}
                        height={1000}
                        priority={isActive}
                        unoptimized
                        className="h-full max-h-full w-auto max-w-none object-contain"
                      />
                    </div>
                    {isActive ? (
                      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between">
                        <div className="hidden max-w-[80%] truncate rounded-full bg-black/45 px-3 py-1 font-mono text-xs text-[var(--color-muted)] backdrop-blur sm:block">
                          {frame.fileName}
                        </div>
                      </div>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="relative h-full min-h-[calc(100svh-12rem)] shrink-0 overflow-hidden lg:min-h-0">
                <div className="flex h-full min-h-0 items-center justify-center bg-black/20 px-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  No public frames available
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={goToNext}
            disabled={!canGoNext}
            className="absolute inset-y-0 right-0 w-1/4 lg:hidden"
            aria-label="Next frame"
          />
          <button
            type="button"
            onClick={goToPrevious}
            disabled={!canGoPrevious}
            className="absolute inset-y-0 left-0 w-1/4 lg:hidden"
            aria-label="Previous frame"
          />
        </div>
      </section>

      <div className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
        <div className="mt-1 mb-4">
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
      </div>
    </div>
  );
}
