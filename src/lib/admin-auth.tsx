import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
 * Admin gate: verifies a live Supabase Auth session AND that the user is
 * present in admin_users (via current_is_admin()). No localStorage, no
 * name/phone matching. Fails → redirect to /login.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Ctx>({ admin: null, loading: true });
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        if (!cancelled) navigate({ to: "/login", search: { redirect: "/admin/dashboard" } });
        return;
      }
      // Verify admin via security-definer RPC (JWT email based)
      const { data: isAdmin, error: rpcErr } = await supabase.rpc("current_is_admin", {});
      if (rpcErr || !isAdmin) {
        if (!cancelled) navigate({ to: "/account" });
        return;
      }
      const { data: row } = await supabase
        .from("admin_users")
        .select("id, name, phone, email, role")
        .eq("id", user.id)
        .maybeSingle();
      if (!row) {
        if (!cancelled) navigate({ to: "/account" });
        return;
      }
      if (!cancelled) setState({ admin: row as AdminSession, loading: false });
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setState({ admin: null, loading: false });
        navigate({ to: "/login" });
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
