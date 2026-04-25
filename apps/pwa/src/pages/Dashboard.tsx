import { useState, useEffect, useMemo, useCallback } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { GlobalStatus } from "@/components/dashboard/GlobalStatus";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";
import { ScreenTimeChart } from "@/components/dashboard/ScreenTimeChart";
import { RecentApps } from "@/components/dashboard/RecentApps";
import { AITransparency } from "@/components/dashboard/AITransparency";
import { DeviceManagement } from "@/components/dashboard/DeviceManagement";
import { ParentalAgreements } from "@/components/dashboard/ParentalAgreements";
import { StreakCounter } from "@/components/dashboard/StreakCounter";
import { EducationalMissions } from "@/components/dashboard/EducationalMissions";
import { ParentalChat } from "@/components/dashboard/ParentalChat";
import { InstallPwaButton } from "@/components/pwa/InstallPwaButton";
import { useAuth } from "@/context/AuthContext";
import { apiUrl } from "@/lib/api";
import type { AlertItem, ChildProfile } from "@/components/dashboard/types";
import { isUuid, mapApiAlert, mapMinorToProfile } from "@kipi/domain";
import type { ApiMinor } from "@kipi/domain";
import { friendlyErrorMessage } from "@/lib/friendly-error";

export default function Dashboard() {
  const { user, accessToken, supabaseMode } = useAuth() as any;
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [remoteMinors, setRemoteMinors] = useState<ApiMinor[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const useLiveApi = supabaseMode && !!accessToken && user?.id && isUuid(user.id);

  const loadDashboard = useCallback(async () => {
    if (!useLiveApi) return;
    setRemoteLoading(true);
    setRemoteError(null);
    try {
      const res = await fetch(`${apiUrl("/api/dashboard")}?parent_id=${encodeURIComponent(user.id)}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`);
      if (!body.ok || !Array.isArray(body.minors)) throw new Error("Respuesta del servidor inesperada.");
      setRemoteMinors(body.minors as ApiMinor[]);
    } catch (e) {
      setRemoteError(friendlyErrorMessage(e));
      setRemoteMinors([]);
    } finally {
      setRemoteLoading(false);
    }
  }, [useLiveApi, accessToken, user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const profiles: ChildProfile[] = useMemo(() => {
    if (!useLiveApi) return [];
    // Importante: filtramos minors con IDs no compatibles con `isUuid()` (legacy seeds).
    // Si no lo hacemos, el Dashboard puede seleccionar un minor inválido y las tarjetas
    // que requieren `minor_id` (screen-time, apps, devices) se quedan en estado vacío.
    return remoteMinors
      .filter((m) => m?.minor_id != null && isUuid(String(m.minor_id)))
      .map(mapMinorToProfile);
  }, [useLiveApi, remoteMinors]);

  useEffect(() => {
    if (activeChildIndex >= profiles.length) setActiveChildIndex(0);
  }, [activeChildIndex, profiles.length]);

  const activeChild = profiles[activeChildIndex] || profiles[0];
  const activeMinorIdFromProfiles = activeChild?.id != null ? String(activeChild.id) : null;
  const apiReadyMinors = useMemo(() => {
    if (!useLiveApi) return [];
    return (remoteMinors ?? []).filter((m) => m?.minor_id != null && isUuid(String(m.minor_id)));
  }, [useLiveApi, remoteMinors]);

  const activeMinorIdFromApi =
    apiReadyMinors[activeChildIndex]?.minor_id ?? apiReadyMinors[0]?.minor_id ?? null;
  const activeMinorId = activeMinorIdFromProfiles ?? activeMinorIdFromApi;
  const minorIdIsApiReady = activeMinorId != null && isUuid(activeMinorId);

  useEffect(() => {
    if (!useLiveApi || !apiReadyMinors.length) return;
    const minor = apiReadyMinors[activeChildIndex] || apiReadyMinors[0];
    const raw = minor?.alertas_recientes || [];
    setAlerts(raw.map(mapApiAlert));
  }, [useLiveApi, apiReadyMinors, activeChildIndex]);

  const unreadAlerts = alerts.filter((a) => !a.read).length;
  const globalStatus: "safe" | "alert" = unreadAlerts > 0 ? "alert" : "safe";

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const hourStr = now.getHours();
  const greeting = hourStr < 12 ? "Buenos días" : hourStr < 18 ? "Buenas tardes" : "Buenas noches";

  const parentName = user?.name?.split?.(" ")?.[0] || "Padre/madre";

  const handleMarkRead = (id: AlertItem["id"]) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const handleDismiss = (id: AlertItem["id"]) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  useEffect(() => {
    if (!activeSection) return;
    const id = `section-${activeSection}`;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        onMenuClick={() => setMobileSidebarOpen(true)}
        activeChildIndex={activeChildIndex}
        onChildChange={setActiveChildIndex}
        profiles={profiles}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          className="hidden lg:flex"
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          unreadAlerts={unreadAlerts}
        />

        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64 border-r border-border">
            <Sidebar
              isMobile
              activeSection={activeSection}
              onSectionChange={(s) => {
                setActiveSection(s);
                setMobileSidebarOpen(false);
              }}
              unreadAlerts={unreadAlerts}
            />
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-auto scrollbar-thin p-4 md:p-5 lg:p-6 pb-24 lg:pb-8">
          {remoteLoading && useLiveApi && (
            <p className="text-sm text-muted-foreground mb-2">Cargando datos reales…</p>
          )}
          {remoteError && useLiveApi && <p className="text-sm text-destructive mb-2">{remoteError}</p>}
          {!useLiveApi && (
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">Conecta tu cuenta para ver datos reales</p>
              <p className="text-sm text-muted-foreground mt-1">
                Inicia sesión con Supabase para cargar menores, alertas y métricas desde el backend.
              </p>
            </div>
          )}

          <div className="mb-4">
            <h1 className="text-xl font-display font-bold text-foreground">
              {greeting}, {parentName}
            </h1>
            <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
            {useLiveApi && (
              <p className="text-xs text-muted-foreground mt-1">
                Modo conectado al backend (menores y alertas desde Supabase).
              </p>
            )}
          </div>

          <section id="section-dashboard">
            <GlobalStatus
              status={globalStatus}
              unreadAlerts={unreadAlerts}
              childName={activeChild?.name || "tu hijo/a"}
              devicesActive={profiles.length}
            />
          </section>

          <section
            className="mt-5 grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-4 lg:gap-5 items-start"
            id="section-streak-chat"
          >
            <div id="section-streak">
              <StreakCounter
                parentId={user?.id}
                accessToken={accessToken}
                enabled={!!useLiveApi}
                childName={activeChild?.name || "tu hijo"}
              />
              <div className="mt-3 flex items-center justify-start">
                <InstallPwaButton />
              </div>
            </div>
            <div id="section-chat">
              <ParentalChat
                parentId={user?.id}
                accessToken={accessToken}
                enabled={!!useLiveApi}
                activeSection={activeSection}
              />
            </div>
          </section>

          <section className="mt-5" id="section-missions">
            <EducationalMissions parentId={user?.id} accessToken={accessToken} enabled={!!useLiveApi} />
          </section>

          {useLiveApi && !remoteLoading && profiles.length === 0 && !remoteError && (
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">No hay menores asociados a tu cuenta</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                El backend está respondiendo, pero no encontró menores para tu usuario actual.
                Si sembraste datos de demo, asegúrate de que el <span className="font-semibold text-foreground">parent_id</span>{" "}
                coincida con tu <span className="font-semibold text-foreground">auth.users.id</span>.
              </p>
              <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground">Tu `auth.users.id` (cópialo al seed si hace falta)</p>
                <p className="text-xs font-mono text-foreground break-all">{String(user?.id || "")}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Archivo: <span className="font-mono">apps/api/supabase/migrations/006_demo_seed.sql</span>
              </p>
            </div>
          )}

          <section className="mt-5" id="section-alerts">
            <AlertsFeed
              alerts={alerts}
              onMarkRead={handleMarkRead}
              onDismiss={handleDismiss}
              minorId={minorIdIsApiReady ? activeMinorId : (activeChild?.id as any)}
              analyzeDisabled={supabaseMode && !!accessToken && !minorIdIsApiReady}
            />
          </section>

          <section className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-5" id="section-screentime">
            <ScreenTimeChart
              minorId={minorIdIsApiReady ? activeMinorId : null}
              accessToken={accessToken}
              enabled={!!useLiveApi}
            />
            <RecentApps
              minorId={minorIdIsApiReady ? activeMinorId : null}
              accessToken={accessToken}
              enabled={!!useLiveApi}
            />
          </section>

          <div className="mt-4 lg:mt-5 grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-5">
            <div className="xl:col-span-2">
              <section id="section-privacy">
                <AITransparency parentId={user?.id} accessToken={accessToken} enabled={!!useLiveApi} />
              </section>
            </div>
            <div className="flex flex-col gap-4">
              <section id="section-devices">
                <DeviceManagement
                  minorId={minorIdIsApiReady ? activeMinorId : null}
                  accessToken={accessToken}
                  enabled={!!useLiveApi && minorIdIsApiReady}
                />
              </section>
              <section id="section-agreement">
                <ParentalAgreements
                  minorId={minorIdIsApiReady ? activeMinorId : (activeChild?.id as any)}
                  switchesDisabled={supabaseMode && !!accessToken && !minorIdIsApiReady}
                />
              </section>
            </div>
          </div>
        </main>
      </div>

      <BottomNav unreadAlerts={unreadAlerts} activeSection={activeSection} onSectionChange={setActiveSection} />
    </div>
  );
}

