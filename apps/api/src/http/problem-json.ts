import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ERROR_HTTP_STATUS, type ApiErrorCode } from "@kipi/domain";

export function writeProblem(
  c: Context,
  code: ApiErrorCode,
  message: string,
): Response {
  const status = ERROR_HTTP_STATUS[code] as ContentfulStatusCode;
  return c.json({ error: code, message }, status);
}
