import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/lib/admin-auth";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const { admin } = useAdmin();
  const [admins, setAdmins] = useState<any[]>([]);
  const [f, setF] = useState({ name: "", phone: "", email: "", role: "client" });

  useEffect(() => {
    if (admin?.role !== "developer") return;
    supabase.from("admin_users").select("*").order("created_at").then(({ data }: { data: any[] | null }) => setAdmins(data ?? []));
  }, [admin]);

  if (admin?.role !== "developer") {
    return <div className="rounded-md border border-dashed border-destructive/40 p-6 text-sm text-destructive">Developer role required.</div>;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("admin_users").insert(f as any);
    if (error) return toast.error(error.message);
    toast.success("Admin added");
    setF({ name: "", phone: "", email: "", role: "client" });
    supabase.from("admin_users").select("*").order("created_at").then(({ data }: { data: any[] | null }) => setAdmins(data ?? []));
  }
  async function remove(id: string) {
    if (!confirm("Remove this admin?")) return;
    await supabase.from("admin_users").delete().eq("id", id);
    setAdmins(admins.filter((a) => a.id !== id));
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-primary md:text-4xl">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage admin accounts and site configuration.</p>
      <hr className="stitch-divider my-6" />

      <section className="stitch-border rounded-lg bg-card p-6">
        <h2 className="font-serif text-xl text-primary">Admin accounts</h2>
        <ul className="mt-4 divide-y divide-border">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{a.name} <span className="text-xs uppercase tracking-wider text-accent">· {a.role}</span></p>
                <p className="text-xs text-muted-foreground">{a.email} · {a.phone}</p>
              </div>
              <button onClick={() => remove(a.id)} className="touch-min rounded-md border border-input px-3 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
        <form onSubmit={add} className="mt-6 grid gap-3 border-t border-border pt-6 md:grid-cols-4">
          <input required placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="touch-min rounded-md border border-input bg-background px-3 text-sm" />
          <input required placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="touch-min rounded-md border border-input bg-background px-3 text-sm" />
          <input required type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="touch-min rounded-md border border-input bg-background px-3 text-sm" />
          <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} className="touch-min rounded-md border border-input bg-background px-3 text-sm">
            <option value="client">Client</option><option value="developer">Developer</option>
          </select>
          <button className="touch-min inline-flex items-center justify-center gap-2 rounded-md bg-primary text-sm text-primary-foreground md:col-span-4"><Plus className="h-4 w-4" /> Add admin</button>
        </form>
      </section>
    </div>
  );
}
