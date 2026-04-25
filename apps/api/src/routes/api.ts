import { Hono } from "hono";
import { ApiErrorCode, decideEscalationToParent, assertRiskLevel } from "@kipi/domain";
import { writeProblem } from "../http/problem-json.js";
import { isUuid } from "../validation/uuid.js";

/**
 * HTTP adapter skeleton. Replace handlers with real adapters (Supabase, model provider)
 * wired to `@kipi/domain` ports while keeping request/response contracts stable.
 */
export const apiRouter = new Hono();

apiRouter.get("/dashboard", async (c) => {
  const parentId = c.req.query("parent_id");
  if (!parentId || !isUuid(parentId)) {
    return writeProblem(
      c,
      ApiErrorCode.INVALID_UUID,
      "parent_id es obligatorio y debe ser un UUID válido.",
    );
  }

  // TODO: `requireSupabaseUser` + `ParentDashboardPort` implementation.
  return c.json({ ok: true as const, minors: [] as const });
});

apiRouter.post("/pairing/generate-code", async (c) => {
  // TODO: persist `PairingCodeIssued` via `PairingPort`.
  return c.json(
    {
      ok: false as const,
      error: ApiErrorCode.INTERNAL_ERROR,
      message: "Emparejamiento aún no conectado a persistencia.",
    },
    501,
  );
});

apiRouter.post("/pairing/confirm-code", async (c) => {
  // TODO: `PairingPort.confirmCode` + auth.
  return c.json(
    {
      ok: false as const,
      error: ApiErrorCode.INTERNAL_ERROR,
      message: "Emparejamiento aún no conectado a persistencia.",
    },
    501,
  );
});

apiRouter.post("/notifications/analyze", async (c) => {
  // Demonstrates domain policy usage at the edge (classification service will call this).
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const record = body as Record<string, unknown>;
  const minorId = record["minor_id"];
  if (typeof minorId !== "string" || !isUuid(minorId)) {
    return writeProblem(
      c,
      ApiErrorCode.INVALID_UUID,
      "minor_id es obligatorio y debe ser un UUID válido.",
    );
  }

  const textPreview = record["text_preview"];
  if (typeof textPreview !== "string" || textPreview.trim().length < 3) {
    return writeProblem(
      c,
      ApiErrorCode.TEXT_TOO_SHORT,
      "text_preview es obligatorio y debe tener contenido suficiente.",
    );
  }

  const shared = Array.isArray(record["shared_alert_levels"])
    ? (record["shared_alert_levels"] as unknown[]).filter(
        (n): n is number => typeof n === "number" && Number.isInteger(n),
      )
    : [1, 2, 3];

  let risk;
  try {
    risk = assertRiskLevel(record["mock_risk_level"] ?? 2);
  } catch {
    return writeProblem(
      c,
      ApiErrorCode.TEXT_TOO_SHORT,
      "mock_risk_level inválido (usa 1, 2 o 3) para este esqueleto.",
    );
  }

  const decision = decideEscalationToParent(risk, shared);

  return c.json({
    ok: true as const,
    echo: { minor_id: minorId, preview_len: textPreview.trim().length },
    system_action: {
      escalated_to_parent: decision.escalatedToParent,
      reason: decision.reason,
    },
    procesado_en_ms: 0,
  });
});
