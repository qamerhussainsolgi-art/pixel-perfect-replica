import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/cart";
import { calculateFinalPrice } from "@/lib/price";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, FolderEdit, X } from "lucide-react";

export const Route = createFileRoute("/admin/products")({ component: ProductsAdmin });

const EMPTY = {
  id: "", name: "", description: "", price: "", discount_percentage: 0,
  seasonal_category_id: "", product_type_category_id: "",
  image_url_1: "", image_url_2: "", image_url_3: "", image_url_4: "",
  stock_status: "in_stock", fabric: "", care: "", sizing: "", featured: false,
};

function ProductsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [seasonalCategories, setSeasonalCategories] = useState<any[]>([]);
  const [productTypeCategories, setProductTypeCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [managerType, setManagerType] = useState<"seasonal" | "type">("seasonal");
  const [inlineNewSeasonal, setInlineNewSeasonal] = useState(false);
  const [inlineSeasonalName, setInlineSeasonalName] = useState("");
  const [inlineNewProductType, setInlineNewProductType] = useState(false);
  const [inlineProductTypeName, setInlineProductTypeName] = useState("");

  // Retrieve draft product if page was reloaded during upload/gallery operations
  useEffect(() => {
    const draft = sessionStorage.getItem("draft-product");
    if (draft) {
      try {
        setEditing(JSON.parse(draft));
      } catch (e) {
        console.error("Failed to parse draft product", e);
      }
    }
  }, []);

  // Save changes to draft product in real-time
  useEffect(() => {
    if (editing) {
      sessionStorage.setItem("draft-product", JSON.stringify(editing));
    }
  }, [editing]);

  async function load() {
    const [{ data: p }, { data: sc }, { data: pt }] = await Promise.all([
      supabase.from("products").select("*, seasonal_category:seasonal_categories(id, name), product_type_category:product_type_categories(id, name)").order("created_at", { ascending: false }),
      supabase.from("seasonal_categories").select("*").order("name"),
      supabase.from("product_type_categories").select("*").order("name"),
    ]);
    setItems(p ?? []);
    setSeasonalCategories(sc ?? []);
    setProductTypeCategories(pt ?? []);
  }
  useEffect(() => { load(); }, []);

  const addCategoryToDatabase = async (name: string, type: "seasonal" | "type") => {
    const table = type === "seasonal" ? "seasonal_categories" : "product_type_categories";
    const { data, error } = await supabase.from(table).insert({ name: name.trim() }).select().single();
    if (error) { toast.error(error.message); return null; }
    return data;
  };

  const handleCreateCategoryInline = async (type: "seasonal" | "type") => {
    const name = type === "seasonal" ? inlineSeasonalName : inlineProductTypeName;
    if (!name.trim()) return;
    const data = await addCategoryToDatabase(name, type);
    if (data) {
      toast.success("Category created.");
      if (type === "seasonal") {
        setSeasonalCategories([...seasonalCategories, data]);
        setEditing({ ...editing, seasonal_category_id: data.id });
        setInlineSeasonalName(""); setInlineNewSeasonal(false);
      } else {
        setProductTypeCategories([...productTypeCategories, data]);
        setEditing({ ...editing, product_type_category_id: data.id });
        setInlineProductTypeName(""); setInlineNewProductType(false);
      }
    }
  };

  const handleDirectCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const data = await addCategoryToDatabase(newCategoryName, managerType);
    if (data) { toast.success("Category registered."); setNewCategoryName(""); load(); }
  };

  const handleDeleteCategory = async (id: string, type: "seasonal" | "type") => {
    if (!confirm("Remove this category? Linked products will lose this tag.")) return;
    const table = type === "seasonal" ? "seasonal_categories" : "product_type_categories";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted."); load(); }
  };

  // ── SUPABASE STORAGE UPLOAD (replaces Cloudflare) ──
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
      const filePath = `products/${fileName}`;

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
    const img1 = editing.image_url_1 || null;
    const img2 = editing.image_url_2 || null;
    const img3 = editing.image_url_3 || null;
    const img4 = editing.image_url_4 || null;
    const legacyImagesArr = [img1, img2, img3, img4].filter(Boolean) as string[];

    const payload: any = {
      name: editing.name,
      description: editing.description,
      price: Number(editing.price),
      discount_percentage: editing.discount_percentage ? Number(editing.discount_percentage) : 0,
      seasonal_category_id: editing.seasonal_category_id || null,
      product_type_category_id: editing.product_type_category_id || null,
      images: legacyImagesArr,
      image_url_1: img1, image_url_2: img2, image_url_3: img3, image_url_4: img4,
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
    sessionStorage.removeItem("draft-product");
    setEditing(null); load();
  }

  const handleCancel = () => {
    sessionStorage.removeItem("draft-product");
    setEditing(null);
  };

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-primary md:text-4xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add, edit, or remove catalog pieces.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setManagerOpen(true)} className="touch-min inline-flex items-center gap-2 rounded-md border border-input bg-card px-4 text-sm text-primary font-medium hover:bg-secondary cursor-pointer">
            <FolderEdit className="h-4 w-4" /> Manage Categories
          </button>
          <button onClick={() => setEditing({ ...EMPTY })} className="touch-min inline-flex items-center gap-2 rounded-md bg-primary px-4 text-sm text-primary-foreground font-medium cursor-pointer">
            <Plus className="h-4 w-4" /> New product
          </button>
        </div>
      </div>
      <hr className="stitch-divider my-6" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className="stitch-border rounded-lg bg-card p-4">
            <div className="flex gap-3">
              <img src={p.image_url_1 || p.images?.[0] || "/images/summer.jpg"} className="h-20 w-16 rounded object-cover" alt="" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1">
                  {p.seasonal_category?.name && <span className="text-[9px] uppercase tracking-wider text-accent border border-dashed border-lavender px-1 rounded-sm">{p.seasonal_category.name}</span>}
                  {p.product_type_category?.name && <span className="text-[9px] uppercase tracking-wider text-accent border border-dashed border-lavender px-1 rounded-sm">{p.product_type_category.name}</span>}
                </div>
                <p className="truncate font-serif text-lg text-primary mt-1">{p.name}</p>
                <div className="text-sm font-medium">
                  {p.discount_percentage > 0 ? (
                    <span className="text-primary">{formatPKR(calculateFinalPrice(Number(p.price), p.discount_percentage))}</span>
                  ) : (
                    <span>{formatPKR(Number(p.price))}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{p.stock_status}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEditing({ ...p, image_url_1: p.image_url_1 || "", image_url_2: p.image_url_2 || "", image_url_3: p.image_url_3 || "", image_url_4: p.image_url_4 || "" })} className="touch-min flex-1 rounded-md border border-input text-sm hover:bg-secondary cursor-pointer"><Pencil className="mx-auto h-4 w-4" /></button>
              <button onClick={() => remove(p.id)} className="touch-min flex-1 rounded-md border border-input text-sm text-destructive hover:bg-secondary cursor-pointer"><Trash2 className="mx-auto h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {managerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setManagerOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-card p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl text-primary">Manage Categories</h2>
              <button onClick={() => setManagerOpen(false)} className="text-muted-foreground hover:text-primary"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleDirectCreateCategory} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setManagerType("seasonal")} className={`touch-min rounded-md text-xs font-medium border ${managerType === "seasonal" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input text-foreground hover:bg-secondary"}`}>Seasonal Category</button>
                <button type="button" onClick={() => setManagerType("type")} className={`touch-min rounded-md text-xs font-medium border ${managerType === "type" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input text-foreground hover:bg-secondary"}`}>Product Type</button>
              </div>
              <div className="flex gap-2">
                <input required type="text" placeholder="New category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="touch-min flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none" />
                <button type="submit" className="touch-min px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Add</button>
              </div>
            </form>
            <div className="mt-6 border-t border-dashed border-border pt-4">
              <h3 className="text-xs uppercase tracking-wider text-accent mb-3 font-semibold">Registered {managerType === "seasonal" ? "Seasons" : "Product Types"}</h3>
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {(managerType === "seasonal" ? seasonalCategories : productTypeCategories).map((c) => (
                  <li key={c.id} className="flex items-center justify-between p-2.5 rounded bg-secondary/20 text-sm">
                    <span className="font-medium text-foreground">{c.name}</span>
                    <button onClick={() => handleDeleteCategory(c.id, managerType)} className="text-destructive hover:text-destructive/80 touch-min"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={handleCancel}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="font-serif text-2xl text-primary">{editing.id ? "Edit product" : "New product"}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm"><span className="text-foreground/80">Name</span><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm"><span className="text-foreground/80">Price (PKR)</span><input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
                <label className="text-sm"><span className="text-foreground/80">Discount %</span><input type="number" min="0" max="100" value={editing.discount_percentage || 0} onChange={(e) => setEditing({ ...editing, discount_percentage: Number(e.target.value) })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
                {editing.price && (
                  <span className="col-span-2 block text-[11px] text-muted-foreground font-medium">
                    Original: Rs. {new Intl.NumberFormat("en-PK").format(Number(editing.price))} → Final: Rs. {new Intl.NumberFormat("en-PK").format(calculateFinalPrice(Number(editing.price), editing.discount_percentage))} ({editing.discount_percentage || 0}% off)
                  </span>
                )}
              </div>

              <label className="text-sm">
                <span className="text-foreground/80">Seasonal Category</span>
                {!inlineNewSeasonal ? (
                  <select value={editing.seasonal_category_id || ""} onChange={(e) => { if (e.target.value === "new") setInlineNewSeasonal(true); else setEditing({ ...editing, seasonal_category_id: e.target.value || null }); }} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3">
                    <option value="">None</option>
                    {seasonalCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="new">+ Add New Category</option>
                  </select>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <input type="text" placeholder="Season name" value={inlineSeasonalName} onChange={(e) => setInlineSeasonalName(e.target.value)} className="touch-min flex-1 rounded-md border border-input bg-background px-2 text-xs" />
                    <button type="button" onClick={() => handleCreateCategoryInline("seasonal")} className="touch-min px-3 rounded bg-primary text-primary-foreground text-xs">Save</button>
                    <button type="button" onClick={() => setInlineNewSeasonal(false)} className="touch-min px-2 rounded border border-input text-xs">Cancel</button>
                  </div>
                )}
              </label>

              <label className="text-sm">
                <span className="text-foreground/80">Product Type</span>
                {!inlineNewProductType ? (
                  <select value={editing.product_type_category_id || ""} onChange={(e) => { if (e.target.value === "new") setInlineNewProductType(true); else setEditing({ ...editing, product_type_category_id: e.target.value || null }); }} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3">
                    <option value="">None</option>
                    {productTypeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="new">+ Add New Product Type</option>
                  </select>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <input type="text" placeholder="Product type name" value={inlineProductTypeName} onChange={(e) => setInlineProductTypeName(e.target.value)} className="touch-min flex-1 rounded-md border border-input bg-background px-2 text-xs" />
                    <button type="button" onClick={() => handleCreateCategoryInline("type")} className="touch-min px-3 rounded bg-primary text-primary-foreground text-xs">Save</button>
                    <button type="button" onClick={() => setInlineNewProductType(false)} className="touch-min px-2 rounded border border-input text-xs">Cancel</button>
                  </div>
                )}
              </label>

              <label className="text-sm md:col-span-2"><span className="text-foreground/80">Description</span><textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background p-2" /></label>

              <div className="text-sm md:col-span-2 space-y-2">
                <span className="text-foreground/80 block font-medium">Product Images (4 Slots)</span>
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

              <label className="text-sm"><span className="text-foreground/80">Fabric</span><input value={editing.fabric || ""} onChange={(e) => setEditing({ ...editing, fabric: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
              <label className="text-sm"><span className="text-foreground/80">Care</span><input value={editing.care || ""} onChange={(e) => setEditing({ ...editing, care: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
              <label className="text-sm md:col-span-2"><span className="text-foreground/80">Sizing</span><input value={editing.sizing || ""} onChange={(e) => setEditing({ ...editing, sizing: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
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
              <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Featured on homepage</label>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={save} className="touch-min flex-1 rounded-md bg-primary text-sm text-primary-foreground">Save</button>
              <button onClick={handleCancel} className="touch-min flex-1 rounded-md border border-input text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}