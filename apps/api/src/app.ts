import { Hono } from "hono";
import { ApiErrorCode } from "@kipi/domain";
import { apiRouter } from "./routes/api.js";
import { applyCorsHeaders } from "./http/cors.js";
import { writeProblem } from "./http/problem-json.js";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { getSupabaseAdmin } from "./supabase/client.js";

export function createApp(): Hono {
  const app = new Hono();

  // Compiled output lives in `apps/api/dist`, sources in `apps/api/src`; both are three levels below repo root.
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const pwaDistDir = process.env["PWA_DIST_DIR"]?.trim()
    ? path.resolve(process.env["PWA_DIST_DIR"].trim())
    : path.resolve(repoRoot, "apps/pwa/dist");
  const pwaIndexHtmlPath = path.resolve(pwaDistDir, "index.html");
  const hasPwaDist = existsSync(pwaIndexHtmlPath);
  const pwaSwPath = path.resolve(pwaDistDir, "sw.js");

  if (hasPwaDist && !existsSync(pwaSwPath)) {
    console.warn("[kipi/api][pwa] index.html exists but sw.js is missing. Rebuild PWA:", pwaSwPath);
  }

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

  app.get("/health", async (c) => {
    const supabaseMeta = (() => {
      const raw = process.env["SUPABASE_URL"];
      if (!raw) return { configured: false as const };
      try {
        const u = new URL(raw);
        return { configured: true as const, host: u.host };
      } catch {
        return { configured: true as const, host: raw };
      }
    })();

    let database: { ok: true } | { ok: false; error: string } | undefined;
    if (c.req.query("check_db") === "1") {
      try {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from("parents").select("id").limit(1);
        database = error ? { ok: false as const, error: error.message } : { ok: true as const };
      } catch (err) {
        database = {
          ok: false as const,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    return c.json({
      ok: true as const,
      service: "kipi-api",
      time: new Date().toISOString(),
      supabase: supabaseMeta,
      ...(database ? { database } : {}),
    });
  });

  app.route("/api", apiRouter);

  // Serve the built PWA at "/" (single-domain deploy on Railway).
  // Build output expected at: apps/pwa/dist
  if (hasPwaDist) {
    app.get("/", (c) => {
      const html = readFileSync(pwaIndexHtmlPath, "utf8");
      return c.html(html);
    });

    // Service worker + Workbox must be real JS (never HTML). Explicit routes avoid SPA fallback / static edge cases.
    app.get("/sw.js", (c) => {
      if (!existsSync(pwaSwPath)) {
        console.warn("[kipi/api][pwa] sw.js missing at", pwaSwPath);
        return c.notFound();
      }
      const body = readFileSync(pwaSwPath);
      return c.body(body, 200, {
        "Content-Type": "application/javascript; charset=utf-8",
        "Service-Worker-Allowed": "/",
        "Cache-Control": "public, max-age=0, must-revalidate",
      });
    });

    app.get("/workbox-:hash.js", (c) => {
      const safe = /^[a-zA-Z0-9_-]+$/.test(c.req.param("hash") ?? "");
      if (!safe) return c.notFound();
      const fp = path.resolve(pwaDistDir, `workbox-${c.req.param("hash")}.js`);
      if (!fp.startsWith(pwaDistDir) || !existsSync(fp)) return c.notFound();
      const body = readFileSync(fp);
      return c.body(body, 200, {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      });
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
      // Do not return HTML for asset URLs (prevents broken SW / MIME issues and long client hangs).
      const p = url.pathname;
      if (p.endsWith(".js") || p.endsWith(".mjs") || p.endsWith(".css") || p.endsWith(".map") || p.endsWith(".woff2")) {
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
