import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/cart";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/products")({ component: ProductsAdmin });

const EMPTY = {
  id: "", name: "", description: "", price: "", collection: "summer",
  images: "", stock_status: "in_stock", fabric: "", care: "", sizing: "", featured: false,
};

function ProductsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  async function load() {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    const payload: any = {
      name: editing.name,
      description: editing.description,
      price: Number(editing.price),
      collection: editing.collection,
      images: editing.images.split("\n").map((s: string) => s.trim()).filter(Boolean),
      stock_status: editing.stock_status,
      fabric: editing.fabric || null,
      care: editing.care || null,
      sizing: editing.sizing || null,
      featured: !!editing.featured,
    };
    if (editing.id) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setEditing(null); load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl text-primary md:text-4xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add, edit, or remove pieces.</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="touch-min inline-flex items-center gap-2 rounded-md bg-primary px-4 text-sm text-primary-foreground">
          <Plus className="h-4 w-4" /> New product
        </button>
      </div>
      <hr className="stitch-divider my-6" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className="stitch-border rounded-lg bg-card p-4">
            <div className="flex gap-3">
              <img src={p.images?.[0] || "/images/summer.jpg"} className="h-20 w-16 rounded object-cover" alt="" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-accent">{p.collection}</p>
                <p className="truncate font-serif text-lg text-primary">{p.name}</p>
                <p className="text-sm">{formatPKR(Number(p.price))}</p>
                <p className="text-xs text-muted-foreground">{p.stock_status}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEditing({ ...p, images: (p.images || []).join("\n") })} className="touch-min flex-1 rounded-md border border-input text-sm hover:bg-secondary"><Pencil className="mx-auto h-4 w-4" /></button>
              <button onClick={() => remove(p.id)} className="touch-min flex-1 rounded-md border border-input text-sm text-destructive hover:bg-secondary"><Trash2 className="mx-auto h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="font-serif text-2xl text-primary">{editing.id ? "Edit product" : "New product"}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-sm"><span className="text-foreground/80">Name</span><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
              <label className="text-sm"><span className="text-foreground/80">Price (PKR)</span><input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
              <label className="text-sm"><span className="text-foreground/80">Collection</span>
                <select value={editing.collection} onChange={(e) => setEditing({ ...editing, collection: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3">
                  <option value="summer">Summer</option><option value="winter">Winter</option><option value="luxury">Luxury</option>
                </select>
              </label>
              <label className="text-sm"><span className="text-foreground/80">Stock</span>
                <select value={editing.stock_status} onChange={(e) => setEditing({ ...editing, stock_status: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3">
                  <option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option>
                </select>
              </label>
              <label className="text-sm md:col-span-2"><span className="text-foreground/80">Description</span><textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background p-2" /></label>
              <label className="text-sm md:col-span-2"><span className="text-foreground/80">Image URLs (one per line)</span><textarea rows={3} value={editing.images} onChange={(e) => setEditing({ ...editing, images: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background p-2 font-mono text-xs" /></label>
              <label className="text-sm"><span className="text-foreground/80">Fabric</span><input value={editing.fabric || ""} onChange={(e) => setEditing({ ...editing, fabric: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
              <label className="text-sm"><span className="text-foreground/80">Care</span><input value={editing.care || ""} onChange={(e) => setEditing({ ...editing, care: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
              <label className="text-sm md:col-span-2"><span className="text-foreground/80">Sizing</span><input value={editing.sizing || ""} onChange={(e) => setEditing({ ...editing, sizing: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
              <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Featured on homepage</label>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={save} className="touch-min flex-1 rounded-md bg-primary text-sm text-primary-foreground">Save</button>
              <button onClick={() => setEditing(null)} className="touch-min flex-1 rounded-md border border-input text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
