/** Producción sin `VITE_API_BASE_URL`: API desplegada (fallback). */
const DEFAULT_API_BASE = "https://kipi-server-production.up.railway.app";

/**
 * `undefined`: variable no definida en build.
 * `""` (cadena vacía en `.env`): forzar URL relativa `/api` (útil con `vite preview` + proxy).
 */
function apiBaseFromEnv(): string | undefined {
  const v = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (v === undefined) return undefined;
  const t = v.trim();
  if (t === "") return "";
  return t.replace(/\/$/, "");
}

function apiBaseUrl(): string {
  const fromEnv = apiBaseFromEnv();
  if (fromEnv !== undefined) return fromEnv;
  // `vite dev` / `vite preview` con bundle que usa base relativa: proxy → misma API local (:8788) que el móvil.
  if (import.meta.env.DEV) return "";
  return DEFAULT_API_BASE.replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const base = apiBaseUrl();
  if (!path) return base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Texto corto para depuración (pantalla de vinculación, logs). */
export function apiBaseLabel(): string {
  const fromEnv = apiBaseFromEnv();
  if (fromEnv !== undefined) return fromEnv === "" ? "Relativo /api (mismo origen o proxy de Vite)" : fromEnv;
  if (import.meta.env.DEV) return "Desarrollo: /api → proxy → API local (vite.config: VITE_API_PROXY_TARGET)";
  return DEFAULT_API_BASE;
}

/** Mensaje legible desde cuerpo `problem+json` (`{ error, message }`) u otro JSON. */
export function messageFromApiJson(data: unknown, res: Response, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
    if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
  }
  if (!res.ok) return `${fallback} (HTTP ${res.status})`;
  return fallback;
}

