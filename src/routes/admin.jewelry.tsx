import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/cart";
import { calculateFinalPrice } from "@/lib/price";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/jewelry")({ component: JewelryAdmin });

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const EMPTY = {
  id: "", name: "", description: "", price: "", discount_percentage: 0,
  image_url_1: "", image_url_2: "", image_url_3: "", image_url_4: "",
  stock_status: "in_stock", seo_slug: "",
};

function JewelryAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("jewelry_products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);

  const handleImageUpload = async (slotNum: 1 | 2 | 3 | 4, file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) { toast.error("Please upload a JPG, PNG, or WEBP image."); return; }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) { toast.error("This image is too large. Please choose a photo under 5MB."); return; }

    setUploadingSlot(slotNum);
    const toastId = toast.loading(`Uploading Image ${slotNum}...`);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `jewelry/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      if (!publicUrl) throw new Error("Could not generate public URL for uploaded image.");

      setEditing((prev: any) => ({ ...prev, [`image_url_${slotNum}`]: publicUrl }));
      toast.success(`Image ${slotNum} uploaded successfully.`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "An unexpected error occurred during upload.", { id: toastId });
    } finally {
      setUploadingSlot(null);
    }
  };

  async function save() {
    if (!editing.name?.trim()) return toast.error("Name is required.");
    if (!editing.price) return toast.error("Price is required.");

    const seoSlug = editing.seo_slug?.trim() || slugify(editing.name);

    const payload: any = {
      name: editing.name.trim(),
      description: editing.description || null,
      price: Number(editing.price),
      discount_percentage: editing.discount_percentage ? Number(editing.discount_percentage) : 0,
      image_url_1: editing.image_url_1 || null,
      image_url_2: editing.image_url_2 || null,
      image_url_3: editing.image_url_3 || null,
      image_url_4: editing.image_url_4 || null,
      stock_status: editing.stock_status,
      seo_slug: seoSlug,
    };

    if (editing.id) {
      const { error } = await supabase.from("jewelry_products").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("jewelry_products").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this jewelry piece?")) return;
    const { error } = await supabase.from("jewelry_products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-primary md:text-4xl">Jewelry</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add, edit, or remove jewelry pieces.</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="touch-min inline-flex items-center gap-2 rounded-md bg-primary px-4 text-sm text-primary-foreground font-medium cursor-pointer">
          <Plus className="h-4 w-4" /> New piece
        </button>
      </div>
      <hr className="stitch-divider my-6" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className="stitch-border rounded-lg bg-card p-4">
            <div className="flex gap-3">
              <img src={p.image_url_1 || "/images/luxury.jpg"} className="h-20 w-16 rounded object-cover" alt="" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-lg text-primary">{p.name}</p>
                <div className="text-sm font-medium">
                  {p.discount_percentage > 0 ? (
                    <span className="text-primary">{formatPKR(calculateFinalPrice(Number(p.price), p.discount_percentage))}</span>
                  ) : (
                    <span>{formatPKR(Number(p.price))}</span>
                  )}
                </div>
                <p className={`text-xs ${p.stock_status === "out_of_stock" ? "text-destructive" : "text-muted-foreground"}`}>
                  {p.stock_status === "out_of_stock" ? "Out of stock" : "In stock"}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEditing({ ...p })} className="touch-min flex-1 rounded-md border border-input text-sm hover:bg-secondary cursor-pointer"><Pencil className="mx-auto h-4 w-4" /></button>
              <button onClick={() => remove(p.id)} className="touch-min flex-1 rounded-md border border-input text-sm text-destructive hover:bg-secondary cursor-pointer"><Trash2 className="mx-auto h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-10">No jewelry pieces yet.</p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="font-serif text-2xl text-primary">{editing.id ? "Edit piece" : "New piece"}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm md:col-span-2">
                <span className="text-foreground/80">Name</span>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm"><span className="text-foreground/80">Price (PKR)</span><input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
                <label className="text-sm"><span className="text-foreground/80">Discount %</span><input type="number" min="0" max="100" value={editing.discount_percentage || 0} onChange={(e) => setEditing({ ...editing, discount_percentage: Number(e.target.value) })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
                {editing.price && (
                  <span className="col-span-2 block text-[11px] text-muted-foreground font-medium">
                    Original: Rs. {new Intl.NumberFormat("en-PK").format(Number(editing.price))} → Final: Rs. {new Intl.NumberFormat("en-PK").format(calculateFinalPrice(Number(editing.price), editing.discount_percentage))} ({editing.discount_percentage || 0}% off)
                  </span>
                )}
              </div>

              <label className="text-sm md:col-span-2">
                <span className="text-foreground/80">Description</span>
                <textarea rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background p-2" />
              </label>

              <div className="text-sm md:col-span-2 space-y-2">
                <span className="text-foreground/80 block font-medium">Jewelry Images (4 Slots)</span>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {([[1, "Main Image"], [2, "Image 2"], [3, "Image 3"], [4, "Image 4"]] as const).map(([num, label]) => {
                    const url = editing[`image_url_${num}`];
                    return (
                      <div key={num} className="flex flex-col items-center justify-between rounded-md border border-dashed border-lavender p-3 bg-secondary/10">
                        <span className="text-[11px] font-medium text-muted-foreground mb-2">{label}</span>
                        {url ? (
                          <div className="relative group w-full aspect-[4/5] overflow-hidden rounded bg-secondary">
                            <img src={url} alt={label} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setEditing((prev: any) => ({ ...prev, [`image_url_${num}`]: "" }))} className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold rounded cursor-pointer border-0">Remove</button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full aspect-[4/5] border-2 border-dashed border-lavender/40 rounded bg-background hover:bg-secondary/20 cursor-pointer transition-colors">
                            <span className="text-xs text-center text-accent font-medium px-2">{uploadingSlot === num ? "Uploading..." : "Upload"}</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingSlot !== null} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(num, file); }} />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-sm md:col-span-2">
                <span className="text-foreground/80 block font-medium mb-2">Stock Status</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, stock_status: "in_stock" })}
                    className={`touch-min rounded-md text-sm font-medium border transition-colors ${
                      editing.stock_status === "in_stock"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-background border-input text-foreground hover:bg-secondary"
                    }`}
                  >
                    In Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, stock_status: "out_of_stock" })}
                    className={`touch-min rounded-md text-sm font-medium border transition-colors ${
                      editing.stock_status === "out_of_stock"
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : "bg-background border-input text-foreground hover:bg-secondary"
                    }`}
                  >
                    Out of Stock
                  </button>
                </div>
              </div>
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
