import { Package, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/friendly-error";
import { hueFromString } from "@kipi/domain";

const RISK_CONFIG = {
  low: {
    label: "Bajo Riesgo",
    className: "bg-safe-subtle text-safe border-safe-border",
  },
  medium: {
    label: "Monitoreo",
    className: "bg-warn-subtle text-warn border-warn-border",
  },
  high: {
    label: "Alto Riesgo",
    className: "bg-warn-subtle text-warn border-warn-border",
  },
} as const;

const ACTION_CONFIG: Record<string, string> = {
  Instalada: "bg-warn/10 text-warn",
  Actualizada: "bg-muted text-muted-foreground",
  Desinstalada: "bg-muted text-muted-foreground",
};

type RecentAppRow = {
  id: string;
  name: string;
  event_type: "installed" | "updated" | "uninstalled";
  category: string;
  risk_level: "low" | "medium" | "high";
  created_at: string | null;
};

function actionLabel(eventType: RecentAppRow["event_type"]): string {
  if (eventType === "installed") return "Instalada";
  if (eventType === "uninstalled") return "Desinstalada";
  return "Actualizada";
}

export function RecentApps({
  minorId,
  accessToken: _accessToken,
  enabled,
}: {
  minorId: string | null;
  accessToken: string | null | undefined;
  enabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apps, setApps] = useState<RecentAppRow[]>([]);

  useEffect(() => {
    if (!enabled || !minorId) {
      setApps([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${apiUrl("/api/apps/recent")}?minor_id=${encodeURIComponent(minorId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as any;
        if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`);
        if (!body.ok || !Array.isArray(body.apps)) throw new Error("Respuesta del servidor inesperada.");
        return body.apps as RecentAppRow[];
      })
      .then((list) => {
        if (cancelled) return;
        setApps(
          (list ?? []).filter(
            (a: any) =>
              a &&
              typeof a.id === "string" &&
              typeof a.name === "string" &&
              typeof a.event_type === "string" &&
              typeof a.category === "string" &&
              typeof a.risk_level === "string",
          ),
        );
      })
      .catch((e) => {
        if (cancelled) return;
        setError(friendlyErrorMessage(e));
        setApps([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, minorId]);

  const view = useMemo(() => {
    return apps.map((a) => {
      const initial = a.name.trim().slice(0, 1).toUpperCase() || "?";
      const hue = hueFromString(a.name);
      const bgColor = `${hue}, 56%, 48%`;
      const action = actionLabel(a.event_type);
      const time = a.created_at ? new Date(a.created_at).toLocaleString("es-MX") : "—";
      return { ...a, initial, bgColor, action, time };
    });
  }, [apps]);

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-card flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-subtle flex items-center justify-center">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-sm">Instalaciones Recientes</h3>
            <p className="text-xs text-muted-foreground">Últimos 7 días</p>
          </div>
        </div>
        <button
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-light transition-colors duration-150 group"
          type="button"
        >
          Ver todo
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-150" />
        </button>
      </div>

      <div className="flex-1 space-y-1">
        {!enabled ? (
          <div className="h-full rounded-xl border border-dashed border-border bg-background/40 flex items-center justify-center px-6 py-10">
            <p className="text-sm text-muted-foreground text-center">Sin datos en vivo para esta vista.</p>
          </div>
        ) : !minorId ? (
          <div className="h-full rounded-xl border border-dashed border-border bg-background/40 flex items-center justify-center px-6 py-10">
            <p className="text-sm text-muted-foreground text-center">
              Vincula o selecciona un menor para ver eventos reales.
            </p>
          </div>
        ) : error ? (
          <div className="h-full rounded-xl border border-dashed border-border bg-background/40 flex items-center justify-center px-6 py-10">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        ) : loading ? (
          <div className="h-full rounded-xl border border-dashed border-border bg-background/40 flex items-center justify-center px-6 py-10">
            <p className="text-sm text-muted-foreground text-center">Cargando…</p>
          </div>
        ) : view.length === 0 ? (
          <div className="h-full rounded-xl border border-dashed border-border bg-background/40 flex items-center justify-center px-6 py-10">
            <p className="text-sm text-muted-foreground text-center">Sin instalaciones recientes.</p>
          </div>
        ) : (
          view.map((app) => {
            const riskConfig = RISK_CONFIG[app.risk_level as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.low;
            const actionClass = ACTION_CONFIG[app.action] || ACTION_CONFIG.Actualizada;

            return (
              <div
                key={app.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors duration-150 group cursor-pointer"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: `hsl(${app.bgColor} / 0.15)`,
                    color: `hsl(${app.bgColor})`,
                  }}
                >
                  {app.initial}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{app.name}</p>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0",
                        actionClass,
                      )}
                    >
                      {app.action}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">{app.time}</span>
                    <span className="text-muted-foreground/30 text-xs">·</span>
                    <span className="text-[11px] text-muted-foreground">{app.category}</span>
                  </div>
                </div>

                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0",
                    riskConfig.className,
                  )}
                >
                  {riskConfig.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default RecentApps;

