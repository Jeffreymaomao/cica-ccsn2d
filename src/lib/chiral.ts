import { promises as fs } from "node:fs";
import path from "node:path";

const PUBLIC_RUN_TOKEN = "_B";
const PUBLIC_TIMES_FILE = "times.dat";
const FRAMES_DIR = "frames";

export type RunSummary = {
  name: string;
  modifiedAt: string;
  fieldCount: number;
  publicFrameCount: number;
};

export type PublicFieldSummary = {
  name: string;
  frameCount: number;
};

export type TimelineFrame = {
  index: number;
  fileName: string;
  imagePath: string;
  timeSeconds: number | null;
  currentTimeSeconds: number | null;
  timeSinceBounceSeconds: number | null;
};

export type PlayerData = {
  run: string;
  selectedField: string;
  fields: PublicFieldSummary[];
  frames: TimelineFrame[];
  totalImages: number;
  totalTimes: number;
};

type TimeRow = {
  index: number;
  currentTimeSeconds: number | null;
  timeSinceBounceSeconds: number | null;
};

function isVisibleName(name: string) {
  return !name.startsWith(".");
}

export function isPublicRun(name: string) {
  return isVisibleName(name) && name.includes(PUBLIC_RUN_TOKEN);
}

export function getChiralRoot() {
  const configuredRoot = process.env.CHIRAL_ROOT?.trim();
  return configuredRoot
    ? path.resolve(configuredRoot)
    : path.resolve(process.cwd(), "../chiral");
}

function ensureSafeSegment(value: string, label: string) {
  if (
    !value ||
    value.includes("\0") ||
    value.includes("/") ||
    value.includes(path.sep) ||
    value === "." ||
    value === ".."
  ) {
    throw new Error(`Invalid ${label}`);
  }
}

export async function ensureChiralRoot() {
  const chiralRoot = getChiralRoot();
  const stats = await fs.stat(chiralRoot);
  if (!stats.isDirectory()) {
    throw new Error("Chiral root is not a directory");
  }
  return chiralRoot;
}

function getRunPath(run: string) {
  ensureSafeSegment(run, "run");
  if (!isPublicRun(run)) {
    throw new Error("Run is not public");
  }

  return path.join(getChiralRoot(), run);
}

function getFramesRoot(run: string) {
  return path.join(getRunPath(run), FRAMES_DIR);
}

function getTimesPath(run: string) {
  return path.join(getRunPath(run), PUBLIC_TIMES_FILE);
}

export async function listRuns(): Promise<RunSummary[]> {
  const chiralRoot = await ensureChiralRoot();
  const entries = await fs.readdir(chiralRoot, { withFileTypes: true });

  const runs = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && isPublicRun(entry.name))
      .map(async (entry) => {
        const directoryPath = path.join(chiralRoot, entry.name);
        const timeCount = await getTimeCount(entry.name).catch(() => 0);
        const fields = await listFields(entry.name, timeCount).catch(() => []);
        const directoryStats = await fs.stat(directoryPath);
        const publicFrameCount = fields.reduce((sum, field) => sum + field.frameCount, 0);

        return {
          name: entry.name,
          modifiedAt: directoryStats.mtime.toISOString(),
          fieldCount: fields.length,
          publicFrameCount,
        } satisfies RunSummary;
      }),
  );

  runs.sort((a, b) => b.name.localeCompare(a.name));
  return runs;
}

async function getTimeCount(run: string) {
  const times = await readTimes(run);
  return times.length;
}

export async function listFields(run: string, visibleLimit?: number): Promise<PublicFieldSummary[]> {
  const framesRoot = getFramesRoot(run);
  const stats = await fs.stat(framesRoot);
  if (!stats.isDirectory()) {
    return [];
  }

  const entries = await fs.readdir(framesRoot, { withFileTypes: true });
  const fields = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && isVisibleName(entry.name))
      .map(async (entry) => {
        const fieldPath = path.join(framesRoot, entry.name);
        const files = await fs.readdir(fieldPath, { withFileTypes: true });
        const rawFrameCount = files.filter(
          (file) => file.isFile() && isPublicImageFile(file.name),
        ).length;
        const frameCount =
          typeof visibleLimit === "number" ? Math.min(rawFrameCount, visibleLimit) : rawFrameCount;

        return {
          name: entry.name,
          frameCount,
        } satisfies PublicFieldSummary;
      }),
  );

  fields.sort((a, b) => a.name.localeCompare(b.name));
  return fields.filter((field) => field.frameCount > 0);
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function readTimes(run: string): Promise<TimeRow[]> {
  const raw = await fs.readFile(getTimesPath(run), "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  return lines.slice(1).flatMap((line) => {
    const [indexText, currentTimeText, , timeSinceBounceText] = line.split(",");
    const index = Number.parseInt(indexText ?? "", 10);

    if (!Number.isInteger(index)) {
      return [];
    }

    return [
      {
        index,
        currentTimeSeconds: parseNumber(currentTimeText),
        timeSinceBounceSeconds: parseNumber(timeSinceBounceText),
      } satisfies TimeRow,
    ];
  });
}

function isPublicImageFile(fileName: string) {
  return path.extname(fileName).toLowerCase() === ".png";
}

function getMimeType(fileName: string) {
  switch (path.extname(fileName).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".dat":
    case ".txt":
    case ".csv":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function extractFrameIndex(fileName: string) {
  const match = fileName.match(/chk_(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

async function listFieldImages(run: string, field: string) {
  ensureSafeSegment(field, "field");

  const fieldPath = path.join(getFramesRoot(run), field);
  const stats = await fs.stat(fieldPath);
  if (!stats.isDirectory()) {
    throw new Error("Field is not public");
  }

  const entries = await fs.readdir(fieldPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && isPublicImageFile(entry.name))
    .map((entry) => {
      const frameIndex = extractFrameIndex(entry.name);
      return {
        fileName: entry.name,
        imagePath: `${FRAMES_DIR}/${field}/${entry.name}`,
        frameIndex: frameIndex ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => {
      if (a.frameIndex !== b.frameIndex) {
        return a.frameIndex - b.frameIndex;
      }
      return a.fileName.localeCompare(b.fileName);
    });
}

export async function getPlayerData(run: string, requestedField?: string | null): Promise<PlayerData> {
  const totalTimes = await getTimeCount(run);
  const fields = await listFields(run, totalTimes);
  if (fields.length === 0) {
    throw new Error("Run has no public frame fields");
  }

  const selectedField = requestedField?.trim() || fields[0].name;
  if (!fields.some((field) => field.name === selectedField)) {
    throw new Error("Requested field is not public");
  }

  const [images, times] = await Promise.all([
    listFieldImages(run, selectedField),
    readTimes(run),
  ]);

  const visibleCount = Math.min(images.length, times.length);
  const frames = Array.from({ length: visibleCount }, (_, index) => {
    const image = images[index];
    const time = times[index];

    return {
      index,
      fileName: image.fileName,
      imagePath: image.imagePath,
      timeSeconds: time.currentTimeSeconds,
      currentTimeSeconds: time.currentTimeSeconds,
      timeSinceBounceSeconds: time.timeSinceBounceSeconds,
    } satisfies TimelineFrame;
  });

  return {
    run,
    selectedField,
    fields,
    frames,
    totalImages: images.length,
    totalTimes,
  };
}

export async function readFrameImage(run: string, field: string, index: number) {
  const playerData = await getPlayerData(run, field);
  if (!Number.isInteger(index) || index < 0 || index >= playerData.frames.length) {
    throw new Error("Frame index out of range");
  }

  const frame = playerData.frames[index];
  const targetPath = path.join(getRunPath(run), frame.imagePath);

  return {
    fileName: frame.fileName,
    mimeType: getMimeType(frame.fileName),
    buffer: await fs.readFile(targetPath),
  };
}

export async function readTimesFile(run: string) {
  const targetPath = getTimesPath(run);
  const stats = await fs.stat(targetPath);
  if (!stats.isFile()) {
    throw new Error("times.dat is not public");
  }

  return {
    fileName: PUBLIC_TIMES_FILE,
    mimeType: getMimeType(PUBLIC_TIMES_FILE),
    buffer: await fs.readFile(targetPath),
  };
}

export function formatDate(isoString: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoString));
}

export function formatSeconds(value: number | null) {
  return value === null ? "n/a" : `${value.toFixed(6)} s`;
}
