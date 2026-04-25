import { Hono } from "hono";
import { apiRouter } from "./routes/api.js";
import { applyCorsHeaders } from "./http/cors.js";

export function createApp(): Hono {
  const app = new Hono();

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
    }),
  );

  app.route("/api", apiRouter);

  return app;
}
