import type { Context } from "hono";

const DEFAULT_DEV_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function parseAllowedOrigins(): ReadonlySet<string> {
  const raw = process.env["CORS_ALLOWED_ORIGINS"]?.trim();
  if (!raw) {
    return DEFAULT_DEV_ORIGINS;
  }
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function applyCorsHeaders(c: Context, origin: string | undefined): void {
  const allowed = parseAllowedOrigins();
  if (origin && allowed.has(origin)) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Vary", "Origin");
    c.header("Access-Control-Allow-Credentials", "true");
  }
  c.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  c.header(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Requested-With",
  );
  c.header("Access-Control-Max-Age", "86400");
}
