import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({ component: OrdersAdmin });

const STATUSES = ["pending", "confirmed", "shipped", "delivered"] as const;

function OrdersAdmin() {
  const [orders, setOrders] = useState<any[]>([]);
  async function load() {
    const { data } = await supabase.from("orders").select("*, customers(name, email, phone)").order("created_at", { ascending: false });
    setOrders(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated"); load();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-primary md:text-4xl">Orders</h1>
      <hr className="stitch-divider my-6" />
      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="stitch-border rounded-lg bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}</p>
                <p className="mt-1 font-serif text-lg text-primary">{o.shipping_name}</p>
                <p className="text-sm text-muted-foreground">{o.shipping_phone} · {o.customers?.email}</p>
                <p className="mt-1 text-sm text-muted-foreground">{o.shipping_address}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium">{formatPKR(Number(o.total_price))}</p>
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="mt-2 touch-min rounded-md border border-input bg-background px-3 text-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              {(o.items as any[]).map((i, k) => (
                <li key={k} className="flex justify-between">
                  <span>{i.name} × {i.qty}</span>
                  <span>{formatPKR(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            {o.order_notes && <p className="mt-3 italic text-muted-foreground">"{o.order_notes}"</p>}
          </div>
        ))}
        {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
      </div>
    </div>
  );
}
