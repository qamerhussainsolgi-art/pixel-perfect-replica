import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart, formatPKR } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Eshaal's Gulkari" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  address: z.string().trim().min(10).max(500),
  order_notes: z.string().trim().max(500).optional(),
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", address: "", order_notes: "" });
  const [busy, setBusy] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { toast.error("Your cart is empty"); return; }
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) { setBusy(false); toast.error("Please sign in"); return; }

    const { data: order, error } = await supabase.from("orders").insert({
      customer_id: userRes.user.id,
      items: items.map((i) => ({ product_id: i.product_id, name: i.name, qty: i.qty, price: i.price })),
      total_price: subtotal,
      shipping_name: form.name,
      shipping_phone: form.phone,
      shipping_address: form.address,
      order_notes: form.order_notes || null,
    }).select("id").single();

    setBusy(false);
    if (error) { toast.error(error.message); return; }

    // Fire email notifications (best-effort). Requires the shared internal token.
    try {
      const token = import.meta.env.VITE_INTERNAL_API_TOKEN as string | undefined;
      if (token) {
        await fetch("/api/public/send-order-emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-internal-token": token },
          body: JSON.stringify({ order_id: order.id }),
        });
      }
    } catch { /* ignore */ }

    clear();
    toast.success("Order placed");
    navigate({ to: "/account/orders/$id", params: { id: order.id } });
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 md:px-8 md:py-14">
      <h1 className="font-serif text-3xl text-primary md:text-4xl">Checkout</h1>
      <hr className="stitch-divider my-6" />

      {/* Order summary (collapsible on mobile) */}
      <div className="mb-6 rounded-md border border-dashed border-lavender bg-background p-4">
        <button onClick={() => setShowSummary(!showSummary)} className="flex w-full items-center justify-between text-left">
          <span className="font-serif text-lg text-primary">Order summary</span>
          <span className="text-sm font-medium">{formatPKR(subtotal)}</span>
        </button>
        {showSummary && (
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.product_id} className="flex justify-between">
                <span>{i.name} × {i.qty}</span>
                <span>{formatPKR(i.price * i.qty)}</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-border pt-2 font-medium">
              <span>Total</span><span>{formatPKR(subtotal)}</span>
            </li>
          </ul>
        )}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {([
          ["name", "Full name", "text"],
          ["phone", "Phone", "tel"],
          ["address", "Delivery address", "textarea"],
          ["order_notes", "Order notes (optional)", "textarea"],
        ] as const).map(([k, label, type]) => (
          <label key={k} className="block text-sm">
            <span className="mb-1 block text-foreground/80">{label}</span>
            {type === "textarea" ? (
              <textarea rows={3} value={form[k]} required={k !== "order_notes"} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2" />
            ) : (
              <input type={type} value={form[k]} required onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="touch-min w-full rounded-md border border-input bg-background px-3" />
            )}
          </label>
        ))}
        <button disabled={busy || items.length === 0} className="touch-min w-full rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {busy ? "Placing order…" : `Place order · ${formatPKR(subtotal)}`}
        </button>
      </form>
    </div>
  );
}
