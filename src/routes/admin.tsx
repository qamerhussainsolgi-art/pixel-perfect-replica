import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { AdminGate, useAdmin } from "@/lib/admin-auth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, ShoppingCart, BookOpen, User, Settings, LineChart, Search, ScrollText, LogOut, Menu, X } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Eshaal's Gulkari" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminGate>
      <AdminShell />
    </AdminGate>
  ),
});

const CLIENT_NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/blog", label: "Blog posts", icon: BookOpen },
  { to: "/admin/profile", label: "My profile", icon: User },
] as const;

const DEV_NAV = [
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/seo", label: "SEO", icon: Search },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart },
  { to: "/admin/logs", label: "Logs", icon: ScrollText },
] as const;

function AdminShell() {
  const { admin, loading } = useAdmin();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (loading || !admin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4 py-10 text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  const items = [...CLIENT_NAV, ...(admin.role === "developer" ? DEV_NAV : [])];

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/login" });
  }

  // Redirect bare /admin to /admin/dashboard
  if (path === "/admin") {
    nav({ to: "/admin/dashboard" });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] gap-6 px-2 py-4 md:px-6">
      <button onClick={() => setOpen(!open)} className="fixed left-3 top-20 z-30 rounded-md border border-border bg-background p-2 md:hidden" aria-label="Menu">
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>
      <aside className={`${open ? "block" : "hidden"} fixed inset-x-0 top-16 z-20 border-b border-border bg-background p-4 md:static md:top-0 md:block md:w-60 md:shrink-0 md:border-0`}>
        <div className="mb-4 rounded-md border border-dashed border-lavender p-3">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium text-primary">{admin.name}</p>
          <p className="text-xs uppercase tracking-wider text-accent">{admin.role}</p>
        </div>
        <nav className="space-y-1 text-sm">
          {items.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="flex touch-min items-center gap-2 rounded-md px-3 hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary" }}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          ))}
          <button onClick={signOut} className="mt-2 flex w-full touch-min items-center gap-2 rounded-md px-3 text-left text-destructive hover:bg-secondary">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </nav>
      </aside>
      <div className="min-w-0 flex-1 pt-10 md:pt-0"><Outlet /></div>
    </div>
  );
}
