import { useEffect, useRef, useState } from "react";
import { Lock, Check, Cpu, ShieldCheck } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/friendly-error";

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  const start = () => {
    if (activeRef.current) return;
    activeRef.current = true;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return { count, start };
}

function Guarantee({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-b-0">
      <div className="w-5 h-5 rounded-full bg-safe-subtle flex items-center justify-center shrink-0">
        <Check className="w-2.5 h-2.5 text-safe" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

type AiStats = {
  messages_analyzed: number;
  threats_detected: number;
  privacy_breaches: number;
  last_audit: string | null;
  data_retention_days: number;
  processing_local: boolean;
};

function formatLastAudit(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX");
}

export function AITransparency({
  parentId,
  accessToken: _accessToken,
  enabled,
}: {
  parentId: string | null | undefined;
  accessToken: string | null | undefined;
  enabled: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AiStats | null>(null);

  const targetMessages = stats?.messages_analyzed ?? 0;
  const { count: msgCount, start: startMsg } = useCountUp(targetMessages);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startMsg();
      },
      { threshold: 0.3 },
    );
    const el = containerRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [startMsg]);

  useEffect(() => {
    if (!enabled || !parentId) {
      setStats(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${apiUrl("/api/ai/stats")}?parent_id=${encodeURIComponent(parentId)}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as any;
        if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`);
        if (!body.ok || !body.stats) throw new Error("Respuesta del servidor inesperada.");
        return body.stats as AiStats;
      })
      .then((s) => {
        if (cancelled) return;
        setStats(s);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(friendlyErrorMessage(e));
        setStats(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, parentId]);

  return (
    <div ref={containerRef} className="bg-card rounded-xl border border-border p-5 shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-subtle flex items-center justify-center">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-sm">Transparencia de IA</h3>
            <p className="text-xs text-muted-foreground">
              {loading ? "Cargando…" : error ? "Error al cargar" : `Auditado · ${formatLastAudit(stats?.last_audit ?? null)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-safe-subtle border border-safe-border">
          <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
          <span className="text-[11px] font-semibold text-safe">Sistema Activo</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-4 rounded-xl bg-primary-subtle border border-primary/10">
          <p className="text-3xl font-bold font-display text-primary tabular-nums">
            {msgCount.toLocaleString("es-MX")}
          </p>
          <p className="text-[11px] text-primary/70 mt-1 font-medium leading-tight">
            mensajes analizados esta semana
          </p>
        </div>
        <div className="text-center p-4 rounded-xl bg-safe-subtle border border-safe-border">
          <p className="text-3xl font-bold font-display text-safe tabular-nums">{stats?.privacy_breaches ?? 0}</p>
          <p className="text-[11px] text-safe/80 mt-1 font-medium leading-tight">
            brechas de privacidad detectadas
          </p>
        </div>
      </div>

      {!enabled ? (
        <div className="mb-4 rounded-xl border border-dashed border-border bg-background/40 p-3.5">
          <p className="text-sm text-muted-foreground">Inicia sesión para ver métricas reales de auditoría.</p>
        </div>
      ) : error ? (
        <div className="mb-4 rounded-xl border border-dashed border-border bg-background/40 p-3.5">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}

      <div className="p-3.5 rounded-xl bg-muted/60 border border-border mb-4">
        <div className="flex items-start gap-2.5">
          <Cpu className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-foreground mb-1 font-display">Tecnología Firewall Ciego™</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              La IA analiza patrones de riesgo directamente en el dispositivo de tu hijo/a. El contenido de los
              mensajes{" "}
              <strong className="text-foreground font-semibold">nunca se almacena ni se envía</strong> a nuestros
              servidores. Privacidad garantizada.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
          Garantías de Privacidad
        </p>
        <div className="rounded-xl border border-border overflow-hidden bg-background/40">
          <Guarantee text="Procesamiento 100% local en el dispositivo del menor" />
          <Guarantee text="Retención de datos: 0 días — purgado automático tras análisis" />
          <Guarantee text="Los padres NO pueden leer mensajes privados del menor" />
          <Guarantee text="Cifrado de extremo a extremo en todas las alertas generadas" />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        <ShieldCheck className="w-4 h-4 text-safe" />
        <p className="text-xs text-muted-foreground">
          Conforme con <span className="font-semibold text-foreground">COPPA, GDPR y LFPDPPP</span>
          {" ·  Certificado por terceros"}
        </p>
      </div>
    </div>
  );
}

export default AITransparency;

