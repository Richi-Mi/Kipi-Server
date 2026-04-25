import { Hono } from "hono";
import { ApiErrorCode } from "@kipi/domain";
import { apiRouter } from "./routes/api.js";
import { applyCorsHeaders } from "./http/cors.js";
import { writeProblem } from "./http/problem-json.js";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";

export function createApp(): Hono {
  const app = new Hono();

  // src/app.ts -> repo root is three levels up: apps/api/src -> repo root
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const pwaDistDir = path.resolve(repoRoot, "apps/pwa/dist");
  const pwaIndexHtmlPath = path.resolve(pwaDistDir, "index.html");
  const hasPwaDist = existsSync(pwaIndexHtmlPath);

  app.onError((err, c) => {
    // Never leak secrets; return stable problem+json and log details server-side.
    console.error("[kipi/api] Unhandled error:", err);
    return writeProblem(
      c,
      ApiErrorCode.INTERNAL_ERROR,
      err instanceof Error ? err.message : "Error interno del servidor.",
    );
  });

  app.use("*", async (c, next) => {
    applyCorsHeaders(c, c.req.header("Origin"));
    if (c.req.method === "OPTIONS") {
      return c.body(null, 204);
    }
    await next();
  });

  app.get("/health", (c) =>
    c.json({
      ok: true as const,
      service: "kipi-api",
      time: new Date().toISOString(),
      supabase: (() => {
        const raw = process.env["SUPABASE_URL"];
        if (!raw) return { configured: false as const };
        try {
          const u = new URL(raw);
          return { configured: true as const, host: u.host };
        } catch {
          return { configured: true as const, host: raw };
        }
      })(),
    }),
  );

  app.route("/api", apiRouter);

  // Serve the built PWA at "/" (single-domain deploy on Railway).
  // Build output expected at: apps/pwa/dist
  if (hasPwaDist) {
    app.get("/", (c) => {
      const html = readFileSync(pwaIndexHtmlPath, "utf8");
      return c.html(html);
    });

    // Serve static assets produced by Vite (e.g. /assets/*, manifest, icons).
    app.use(
      "/*",
      serveStatic({
        root: pwaDistDir,
      }),
    );

    // SPA fallback: any non-API route should return index.html.
    app.get("*", (c) => {
      const url = new URL(c.req.url);
      if (url.pathname.startsWith("/api") || url.pathname === "/health") {
        return c.notFound();
      }
      const html = readFileSync(pwaIndexHtmlPath, "utf8");
      return c.html(html);
    });
  } else {
    app.get("/", (c) =>
      c.text(
        "Kipi Safe API está en línea. La PWA no está construida. Ejecuta `pnpm --filter @kipi/pwa build` para generar `apps/pwa/dist`.",
        200,
      ),
    );
  }

  return app;
}
