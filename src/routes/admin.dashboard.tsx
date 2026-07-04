import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/lib/admin-auth";
import { formatPKR } from "@/lib/cart";

export const Route = createFileRoute("/admin/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { admin } = useAdmin();
  const [stats, setStats] = useState({ products: 0, orders: 0, pending: 0, posts: 0, revenue: 0 });
  useEffect(() => {
    (async () => {
      const [{ count: products }, { count: orders }, { count: pending }, { count: posts }, { data: revs }] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total_price"),
      ]);
      const revenue = (revs ?? []).reduce((s: number, r: any) => s + Number(r.total_price), 0);
      setStats({ products: products ?? 0, orders: orders ?? 0, pending: pending ?? 0, posts: posts ?? 0, revenue });
    })();
  }, []);

  const cards = [
    { label: "Products", value: stats.products },
    { label: "All orders", value: stats.orders },
    { label: "Pending orders", value: stats.pending },
    { label: "Blog posts", value: stats.posts },
    { label: "Revenue", value: formatPKR(stats.revenue) },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-primary md:text-4xl">Welcome, {admin?.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Here's what's happening in the studio today.</p>
      <hr className="stitch-divider my-6" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="stitch-border rounded-lg bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="mt-2 font-serif text-2xl text-primary">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
