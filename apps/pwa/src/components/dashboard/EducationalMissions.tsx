import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/friendly-error";

function InstitutionBadge({ shortName }: { shortName: string }) {
  const palette: Record<string, string> = {
    DIF: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800",
    CNDH: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-800",
    "PC / SAPTEL":
      "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800",
  };
  const cls = palette[shortName] || palette.DIF;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border", cls)}>
      {shortName}
    </span>
  );
}

type Mission = {
  id: string;
  title: string;
  description: string;
  institution: string;
  institution_short: string;
  reward_visual?: string | null;
  is_completed: boolean;
};

export function EducationalMissions({
  parentId,
  accessToken: _accessToken,
  enabled,
}: {
  parentId: string | undefined | null;
  accessToken: string | undefined | null;
  enabled: boolean;
}) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !parentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl("/api/gamification/missions")}?parent_id=${encodeURIComponent(parentId)}`);
      const body = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`);
      if (!body.ok || !Array.isArray(body.missions)) throw new Error("Respuesta del servidor inesperada.");
      setMissions(body.missions as Mission[]);
    } catch (e) {
      setError(friendlyErrorMessage(e));
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, parentId]);

  useEffect(() => {
    load();
  }, [load]);

  const complete = async (missionId: string) => {
    if (!enabled || !parentId) return;
    setBusyId(missionId);
    try {
      const res = await fetch(apiUrl("/api/gamification/missions/complete"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parent_id: parentId, mission_id: missionId }),
      });
      const body = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`);
      setCelebrateId(missionId);
      window.setTimeout(() => setCelebrateId(null), 1400);
      await load();
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  if (!enabled) {
    return (
      <section className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
        Sin datos en vivo para esta vista.
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" aria-hidden />
        <h2 className="text-base font-display font-bold text-foreground">Misiones de alfabetización digital</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Lecturas breves de referencias oficiales. Al marcarlas como leídas, desbloqueas recompensas visuales (MVP).
      </p>
      {loading && <p className="text-sm text-muted-foreground">Cargando misiones…</p>}
      {error && !loading && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {missions.map((m) => {
          const done = m.is_completed;
          const celebrating = celebrateId === m.id;
          return (
            <article
              key={m.id}
              className={cn(
                "rounded-xl border p-4 flex flex-col gap-3 transition-shadow",
                "bg-card border-border hover:shadow-md",
                done && "opacity-95",
                celebrating && "ring-2 ring-emerald-400/80 shadow-lg",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <InstitutionBadge shortName={m.institution_short} />
                {done && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-label="Completada" />}
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm leading-snug">{m.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
                <p className="text-[11px] text-sky-700/90 dark:text-sky-300/90 mt-2">Fuente: {m.institution}</p>
                {m.reward_visual && (
                  <p className="text-[11px] text-emerald-700/85 dark:text-emerald-300/85 mt-1">
                    Recompensa: {m.reward_visual}
                  </p>
                )}
              </div>
              <div className="mt-auto pt-1">
                {done ? (
                  <span className="inline-flex items-center justify-center w-full py-2 text-sm font-medium rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-400/30">
                    Misión completada
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === m.id}
                    onClick={() => complete(m.id)}
                    className={cn(
                      "w-full py-2 text-sm font-semibold rounded-lg transition",
                      "bg-sky-600 hover:bg-sky-700 text-white",
                      "disabled:opacity-60 disabled:pointer-events-none",
                    )}
                  >
                    {busyId === m.id ? "Guardando…" : "Marcar como leído"}
                  </button>
                )}
                {celebrating && (
                  <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 mt-2 animate-pulse" aria-live="polite">
                    ¡Listo! +1 en tu progreso
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default EducationalMissions;

