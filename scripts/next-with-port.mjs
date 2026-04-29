import { spawn } from "node:child_process";
import path from "node:path";

const DEFAULT_PORT = 3030;
const VALID_COMMANDS = new Set(["dev", "start"]);

const command = process.argv[2];
const rawPort = process.argv[3] ?? process.env.PORT ?? String(DEFAULT_PORT);

if (!VALID_COMMANDS.has(command)) {
  console.error(`Expected "dev" or "start", received: ${command ?? "(missing)"}`);
  process.exit(1);
}

const port = Number.parseInt(rawPort, 10);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error(`Invalid port: ${rawPort}`);
  process.exit(1);
}

const nextBinary = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next",
);

const args = [command, "-p", String(port)];
if (command === "dev") {
  args.splice(1, 0, "--turbopack");
}

const child = spawn(nextBinary, args, {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
