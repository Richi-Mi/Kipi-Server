/** Producción sin `VITE_API_BASE_URL`: API desplegada (fallback). */
const DEFAULT_API_BASE = "https://kipi-server-production.up.railway.app";

function apiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  // En `vite dev`, rutas relativas pasan por el proxy → mismo Supabase que lee `apps/api` (.env raíz).
  if (import.meta.env.DEV) return "";
  return DEFAULT_API_BASE.replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const base = apiBaseUrl();
  if (!path) return base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

