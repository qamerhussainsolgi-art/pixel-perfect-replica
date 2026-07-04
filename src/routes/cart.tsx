import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart, formatPKR } from "@/lib/cart";
import { Minus, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Eshaal's Gulkari" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();

  return (
    <div className="mx-auto max-w-[960px] px-4 py-10 md:px-8 md:py-16">
      <h1 className="font-serif text-3xl text-primary md:text-4xl">Your cart</h1>
      <hr className="stitch-divider my-6" />

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Link to="/collections" className="mt-6 inline-block touch-min rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground">
            Explore collections
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 md:grid-cols-3">
          <ul className="space-y-4 md:col-span-2">
            {items.map((i) => (
              <li key={i.product_id} className="flex gap-4 rounded-md border border-border bg-card p-3">
                <Link to="/product/$slug" params={{ slug: i.slug }} className="shrink-0">
                  <img src={i.image} alt={i.name} className="h-24 w-20 rounded object-cover" />
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <Link to="/product/$slug" params={{ slug: i.slug }} className="font-serif text-lg text-foreground hover:text-primary">{i.name}</Link>
                    <button onClick={() => remove(i.product_id)} aria-label="Remove" className="p-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center rounded-md border border-border">
                      <button onClick={() => setQty(i.product_id, i.qty - 1)} className="touch-min px-3" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="min-w-8 text-center text-sm">{i.qty}</span>
                      <button onClick={() => setQty(i.product_id, i.qty + 1)} className="touch-min px-3" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="text-sm font-medium">{formatPKR(i.price * i.qty)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-md border border-dashed border-lavender bg-background p-5">
            <p className="font-serif text-lg text-primary">Order summary</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Subtotal</span><span>{formatPKR(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Shipping calculated at checkout.</p>
            <Link to="/checkout" className="mt-6 touch-min block w-full rounded-md bg-primary px-6 text-center text-sm font-medium leading-[44px] text-primary-foreground">
              Proceed to checkout
            </Link>
            <Link to="/collections" className="mt-2 block text-center text-sm text-primary hover:underline">Continue shopping</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
