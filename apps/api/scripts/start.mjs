/**
 * Production entry: runs `pnpm run build` in this package only if `dist/server.js` is missing
 * (e.g. PaaS start command without a separate build step). If dist exists, starts immediately.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distServer = path.join(apiRoot, "dist", "server.js");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: apiRoot,
    stdio: "inherit",
    ...opts,
  });
  if (r.status !== 0 && r.status != null) process.exit(r.status);
  if (r.error) throw r.error;
}

if (!existsSync(distServer)) {
  console.warn("[kipi/api] dist/server.js not found; running build (domain + tsc)…");
  // `shell: true` on Windows helps resolve `pnpm` on PATH; avoid for `node` (paths with spaces break).
  run("pnpm", ["run", "build"], { shell: process.platform === "win32" });
}

run(process.execPath, [distServer], { shell: false });
