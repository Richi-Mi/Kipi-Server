import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiUrl } from "@/lib/api";

const AuthContext = createContext(null);

/** Padre/menor de demo: UUID válido para todas las rutas `/api/*` sin autenticación. */
export const DEMO_PARENT_ID = "00000000-0000-4000-8000-000000000001";

async function fetchDashboardMinorsCount(userId) {
  const res = await fetch(`${apiUrl("/api/dashboard")}?parent_id=${encodeURIComponent(userId)}`, {
    cache: "no-store",
  });
  if (!res.ok) return { ok: false, count: 0 };
  const data = await res.json();
  const n = Array.isArray(data.minors) ? data.minors.length : 0;
  return { ok: true, count: n };
}

export const AuthProvider = ({ children }) => {
  const [user] = useState({
    id: DEMO_PARENT_ID,
    email: "demo@kipi.local",
    name: "Demo",
  });
  const [accessToken] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { ok, count } = await fetchDashboardMinorsCount(DEMO_PARENT_ID);
      if (cancelled) return;
      if (ok) setIsNewUser(count === 0);
      setAuthLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async () => {
    const { ok, count } = await fetchDashboardMinorsCount(DEMO_PARENT_ID);
    if (ok) setIsNewUser(count === 0);
    return { success: true, isNewUser: ok ? count === 0 : false };
  }, []);

  const register = useCallback(async () => {
    return { success: true, isNewUser: true };
  }, []);

  const completePairing = useCallback(async () => {
    const { ok, count } = await fetchDashboardMinorsCount(DEMO_PARENT_ID);
    if (ok) setIsNewUser(count === 0);
    else setIsNewUser(false);
  }, []);

  const logout = useCallback(async () => {}, []);

  const refreshBackendState = useCallback(async () => {
    await completePairing();
  }, [completePairing]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isNewUser,
        authLoading,
        supabaseMode: false,
        login,
        register,
        completePairing,
        logout,
        refreshBackendState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default AuthContext;
