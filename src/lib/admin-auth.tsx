import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "client" | "developer";
}

type Ctx = { admin: AdminSession | null; loading: boolean };
const AdminCtx = createContext<Ctx>({ admin: null, loading: true });

/**
 * Admin gate: on every mount (and on every auth state change) it re-verifies
 * the Supabase session + admin_users row. Never trusts cached state — this is
 * what prevents "leave /admin, come back, see customer view" bugs.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Ctx>({ admin: null, loading: true });
  const navigate = useNavigate();
  const runIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const runId = ++runIdRef.current;
      setState((s) => ({ admin: s.admin, loading: true }));

      // getSession() reads from local storage synchronously-ish (no network),
      // so it doesn't race the way getUser() can on remount.
      const { data: sessionRes } = await supabase.auth.getSession();
      const session = sessionRes.session;

      if (cancelled || runId !== runIdRef.current) return;

      if (!session?.user) {
        setState({ admin: null, loading: false });
        navigate({ to: "/login", search: { redirect: "/admin/dashboard" } });
        return;
      }

      const user = session.user;

      const { data: isAdmin, error: rpcErr } = await supabase.rpc("current_is_admin", {});
      if (cancelled || runId !== runIdRef.current) return;

      if (rpcErr || !isAdmin) {
        setState({ admin: null, loading: false });
        navigate({ to: "/account" });
        return;
      }

      const { data: row } = await supabase
        .from("admin_users")
        .select("id, name, phone, email, role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled || runId !== runIdRef.current) return;

      if (!row) {
        setState({ admin: null, loading: false });
        navigate({ to: "/account" });
        return;
      }

      setState({ admin: row as AdminSession, loading: false });
    }

    check();

    // Re-run the check whenever auth state changes (sign-in, token refresh,
    // sign-out from another tab, etc.) so admin status is never stale.
    const { data: sub } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_OUT") {
        setState({ admin: null, loading: false });
        navigate({ to: "/login" });
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        check();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return <AdminCtx.Provider value={state}>{children}</AdminCtx.Provider>;
}

export function useAdmin() {
  return useContext(AdminCtx);
}
