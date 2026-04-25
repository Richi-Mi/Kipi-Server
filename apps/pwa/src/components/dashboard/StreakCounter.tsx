import { useEffect, useState, useCallback } from "react";
import { Flame, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/friendly-error";

export function StreakCounter({
  parentId,
  accessToken: _accessToken,
  enabled,
  childName = "tu hijo",
}: {
  parentId: string | undefined | null;
  accessToken: string | undefined | null;
  enabled: boolean;
  childName?: string;
}) {
  const [streak, setStreak] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !parentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl("/api/gamification/streak")}?parent_id=${encodeURIComponent(parentId)}`);
      const body = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`);
      if (typeof body.safe_days_streak !== "number") throw new Error("Respuesta inválida del servidor.");
      setStreak(body.safe_days_streak);
    } catch (e) {
      setError(friendlyErrorMessage(e));
      setStreak(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, parentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!enabled) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        Sin datos en vivo para esta vista.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all duration-300",
        "bg-gradient-to-br from-emerald-50/90 to-sky-50/80 dark:from-emerald-950/40 dark:to-sky-950/30",
        "border-emerald-200/80 dark:border-emerald-800/60",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center border border-emerald-300/40">
            <Flame className="w-7 h-7 text-amber-500" aria-hidden />
          </div>
          <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-400/40" aria-hidden>
            <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700/90 dark:text-emerald-400/90">
            Racha de paz mental
          </p>
          {loading && <p className="text-sm text-muted-foreground mt-1">Calculando tu racha…</p>}
          {error && !loading && <p className="text-sm text-destructive mt-1">{error}</p>}
          {!loading && !error && streak !== null && (
            <>
              <h2 className="text-lg font-display font-bold text-emerald-900 dark:text-emerald-100 mt-0.5 leading-snug">
                ¡Excelente! {streak} día{streak === 1 ? "" : "s"} de paz mental.
              </h2>
              <p className="text-sm text-emerald-800/85 dark:text-emerald-200/85 mt-1 leading-relaxed">
                Sin alertas de nivel 2 o 3: {childName} navega con más tranquilidad y tú también.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StreakCounter;

