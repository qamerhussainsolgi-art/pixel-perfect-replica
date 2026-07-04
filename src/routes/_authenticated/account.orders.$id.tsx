import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/cart";

export const Route = createFileRoute("/_authenticated/account/orders/$id")({
  head: () => ({ meta: [{ title: "Order details — Eshaal's Gulkari" }, { name: "robots", content: "noindex" }] }),
  component: OrderDetail,
});

const STATUS = ["pending", "confirmed", "shipped", "delivered"];

function OrderDetail() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  useEffect(() => {
    supabase.from("orders").select("*").eq("id", id).maybeSingle().then(({ data }) => setOrder(data));
  }, [id]);

  if (!order) return <div className="mx-auto max-w-[720px] px-4 py-16 text-center text-muted-foreground">Loading…</div>;

  const stepIndex = STATUS.indexOf(order.status);

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 md:px-8 md:py-14">
      <Link to="/account" className="text-xs uppercase tracking-wider text-accent">← Back to account</Link>
      <h1 className="mt-3 font-serif text-3xl text-primary md:text-4xl">Order #{order.id.slice(0, 8)}</h1>
      <p className="text-sm text-muted-foreground">Placed {new Date(order.created_at).toLocaleString()}</p>
      <hr className="stitch-divider my-6" />

      <div className="mb-8 grid grid-cols-4 gap-2 text-center text-[10px] uppercase tracking-wider">
        {STATUS.map((s, i) => (
          <div key={s}>
            <div className={`mx-auto mb-2 h-2 w-full rounded-full ${i <= stepIndex ? "bg-primary" : "bg-border"}`} />
            <span className={i <= stepIndex ? "text-primary" : "text-muted-foreground"}>{s}</span>
          </div>
        ))}
      </div>

      <section className="rounded-md border border-border bg-card p-5">
        <p className="font-serif text-lg text-primary">Items</p>
        <ul className="mt-3 space-y-2 text-sm">
          {(order.items as any[]).map((i, k) => (
            <li key={k} className="flex justify-between">
              <span>{i.name} × {i.qty}</span>
              <span>{formatPKR(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-border pt-3 font-medium">
          <span>Total</span><span>{formatPKR(Number(order.total_price))}</span>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-border bg-card p-5 text-sm">
        <p className="font-serif text-lg text-primary">Shipping</p>
        <p className="mt-2">{order.shipping_name}</p>
        <p className="text-muted-foreground">{order.shipping_phone}</p>
        <p className="mt-1 text-muted-foreground">{order.shipping_address}</p>
        {order.order_notes && <p className="mt-3 border-t border-border pt-2 text-muted-foreground italic">"{order.order_notes}"</p>}
      </section>
    </div>
  );
}
