import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/")({
  head: () => ({ meta: [{ title: "My account — Eshaal's Gulkari" }, { name: "robots", content: "noindex" }] }),
  component: AccountPage,
});

function AccountPage() {
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  useEffect(() => { load(); }, []);
  async function load() {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return;
    const { data: p } = await supabase.from("customers").select("*").eq("id", userRes.user.id).maybeSingle();
    setProfile(p);
    if (p) setForm({ name: p.name || "", phone: p.phone || "", address: p.address || "" });
    const { data: o } = await supabase.from("orders").select("id, status, total_price, created_at").order("created_at", { ascending: false });
    setOrders(o ?? []);
  }
  async function save() {
    const { error } = await supabase.from("customers").update(form).eq("id", profile.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    setEditing(false);
    load();
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 py-8 md:px-8 md:py-14">
      <h1 className="font-serif text-3xl text-primary md:text-4xl">My account</h1>
      <hr className="stitch-divider my-6" />

      <div className="grid gap-8 md:grid-cols-3">
        <section className="md:col-span-2">
          <h2 className="font-serif text-xl text-primary">Order history</h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No orders yet. <Link to="/collections" className="text-primary underline">Start shopping →</Link></p>
          ) : (
            <ul className="mt-4 space-y-3">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link to="/account/orders/$id" params={{ id: o.id }} className="flex items-center justify-between rounded-md border border-border bg-card p-4 hover:border-primary/40">
                    <div>
                      <p className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8)}</p>
                      <p className="text-sm text-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-accent">{o.status}</p>
                      <p className="text-sm font-medium">{formatPKR(Number(o.total_price))}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="stitch-border rounded-lg bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-primary">Profile</h2>
            <button onClick={() => setEditing(!editing)} className="text-xs text-primary underline">{editing ? "Cancel" : "Edit"}</button>
          </div>
          {profile && !editing && (
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {profile.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {profile.email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {profile.phone || "—"}</p>
              <p><span className="text-muted-foreground">Address:</span> {profile.address || "—"}</p>
            </div>
          )}
          {editing && (
            <div className="mt-4 space-y-3">
              <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="touch-min w-full rounded-md border border-input bg-background px-3 text-sm" />
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="touch-min w-full rounded-md border border-input bg-background px-3 text-sm" />
              <textarea rows={3} placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-md border border-input bg-background p-2 text-sm" />
              <button onClick={save} className="touch-min w-full rounded-md bg-primary text-sm text-primary-foreground">Save</button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
