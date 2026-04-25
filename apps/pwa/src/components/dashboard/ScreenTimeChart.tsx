import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";
import { Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/friendly-error";

const CATEGORY_COLORS = [
  "hsl(213, 55%, 48%)",
  "hsl(38, 85%, 50%)",
  "hsl(270, 48%, 55%)",
  "hsl(157, 55%, 40%)",
  "hsl(193, 65%, 42%)",
];

function CategoryTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-elevated">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-bold text-foreground">{payload[0].value}h hoy</p>
      </div>
    );
  }
  return null;
}

function WeeklyTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-elevated">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-bold text-foreground">{payload[0].value}h de pantalla</p>
      </div>
    );
  }
  return null;
}

type ScreenTimeCategory = { name: string; hours: number; key: string };
type WeeklyPoint = { day: string; hours: number };

export function ScreenTimeChart({
  minorId,
  accessToken: _accessToken,
  enabled,
}: {
  minorId: string | null;
  accessToken: string | null | undefined;
  enabled: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"category" | "weekly">("category");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [byCategory, setByCategory] = useState<ScreenTimeCategory[]>([]);
  const [weekly, setWeekly] = useState<WeeklyPoint[]>([]);

  useEffect(() => {
    if (!enabled || !minorId) {
      setByCategory([]);
      setWeekly([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${apiUrl("/api/screen-time")}?minor_id=${encodeURIComponent(minorId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as any;
        if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`);
        if (!body.ok) throw new Error("Respuesta del servidor inesperada.");
        return body;
      })
      .then((body: any) => {
        if (cancelled) return;
        const cats = Array.isArray(body?.today?.by_category) ? (body.today.by_category as ScreenTimeCategory[]) : [];
        const wk = Array.isArray(body?.weekly) ? (body.weekly as WeeklyPoint[]) : [];
        setByCategory(
          cats.filter(
            (c) => c && typeof c.name === "string" && typeof c.hours === "number" && typeof c.key === "string",
          ),
        );
        setWeekly(wk.filter((p) => p && typeof p.day === "string" && typeof p.hours === "number"));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(friendlyErrorMessage(e));
        setByCategory([]);
        setWeekly([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, minorId]);

  const totalToday = useMemo(() => {
    return byCategory.reduce((acc, item) => acc + item.hours, 0).toFixed(1);
  }, [byCategory]);

  const hasData = byCategory.length > 0 || weekly.length > 0;
  const needsMinor = enabled && !minorId;

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-subtle flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-sm">Tiempo de Pantalla</h3>
            <p className="text-xs text-muted-foreground">
              {loading ? (
                "Cargando…"
              ) : (
                <>
                  Hoy · <span className="font-semibold text-foreground">{totalToday}h</span> en total
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {[
            { id: "category", label: "Por App" },
            { id: "weekly", label: "Semana" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "category" | "weekly")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150",
                activeTab === tab.id ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-52">
        {!enabled ? (
          <div className="h-full rounded-xl border border-dashed border-border bg-background/40 flex items-center justify-center px-6">
            <p className="text-sm text-muted-foreground text-center">Sin datos en vivo para esta vista.</p>
          </div>
        ) : needsMinor ? (
          <div className="h-full rounded-xl border border-dashed border-border bg-background/40 flex items-center justify-center px-6">
            <p className="text-sm text-muted-foreground text-center">
              Vincula o selecciona un menor para ver métricas reales.
            </p>
          </div>
        ) : error ? (
          <div className="h-full rounded-xl border border-dashed border-border bg-background/40 flex items-center justify-center px-6">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        ) : !hasData ? (
          <div className="h-full rounded-xl border border-dashed border-border bg-background/40 flex items-center justify-center px-6">
            <p className="text-sm text-muted-foreground text-center">Sin datos de uso aún.</p>
          </div>
        ) : activeTab === "category" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCategory} margin={{ top: 5, right: 10, left: -22, bottom: 5 }} barCategoryGap="32%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(213, 18%, 90%)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(213, 16%, 50%)", fontSize: 11, fontFamily: "Inter" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(213, 16%, 50%)", fontSize: 11, fontFamily: "Inter" }} tickFormatter={(v) => `${v}h`} />
              <Tooltip content={<CategoryTooltip />} cursor={{ fill: "hsl(213, 28%, 96%)", radius: 4 }} />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {byCategory.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weekly} margin={{ top: 5, right: 10, left: -22, bottom: 5 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(213, 55%, 48%)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="hsl(213, 55%, 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(213, 18%, 90%)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(213, 16%, 50%)", fontSize: 11, fontFamily: "Inter" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(213, 16%, 50%)", fontSize: 11, fontFamily: "Inter" }} tickFormatter={(v) => `${v}h`} />
              <Tooltip content={<WeeklyTooltip />} />
              <ReferenceLine
                y={5.1}
                stroke="hsl(38, 85%, 50%)"
                strokeDasharray="4 3"
                strokeOpacity={0.6}
                label={{ value: "Promedio", fill: "hsl(38, 85%, 50%)", fontSize: 10, position: "insideTopRight" }}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="hsl(213, 55%, 48%)"
                strokeWidth={2.5}
                fill="url(#areaGradient)"
                dot={{ fill: "hsl(213, 55%, 48%)", stroke: "hsl(0, 0%, 100%)", strokeWidth: 2, r: 3.5 }}
                activeDot={{ r: 5.5, fill: "hsl(213, 55%, 48%)", stroke: "hsl(0, 0%, 100%)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {activeTab === "category" && enabled && !error && byCategory.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-x-3 gap-y-1.5">
          {byCategory.map((item, index) => (
            <div key={item.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: CATEGORY_COLORS[index] }} />
              <span className="text-[11px] text-muted-foreground">
                {item.name} <span className="font-semibold text-foreground">{item.hours}h</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "weekly" && enabled && !error && weekly.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-warn" />
          <span className="text-xs text-muted-foreground">
            Promedio semanal: <span className="font-semibold text-foreground">5.1h/día</span>
            {" ·  "}
            <span className="text-warn font-medium">+12% vs semana anterior</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default ScreenTimeChart;

