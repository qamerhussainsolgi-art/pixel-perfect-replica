import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/blog")({ component: BlogAdmin });

const EMPTY = { id: "", title: "", excerpt: "", content: "", featured_image: "", category: "", author: "Tazeen Faisal", published: true };

function BlogAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  async function load() {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    const payload: any = {
      title: editing.title,
      excerpt: editing.excerpt || null,
      content: editing.content,
      featured_image: editing.featured_image || null,
      category: editing.category || null,
      author: editing.author || "Tazeen Faisal",
      published_date: editing.published ? (editing.published_date || new Date().toISOString()) : null,
    };
    if (editing.id) {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved"); setEditing(null); load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <h1 className="font-serif text-3xl text-primary md:text-4xl">Blog posts</h1>
        <button onClick={() => setEditing({ ...EMPTY })} className="touch-min inline-flex items-center gap-2 rounded-md bg-primary px-4 text-sm text-primary-foreground">
          <Plus className="h-4 w-4" /> New post
        </button>
      </div>
      <hr className="stitch-divider my-6" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((p) => (
          <div key={p.id} className="stitch-border rounded-lg bg-card p-4">
            {p.featured_image && <img src={p.featured_image} className="mb-3 aspect-[16/9] w-full rounded object-cover" alt="" />}
            <p className="text-[10px] uppercase tracking-wider text-accent">{p.category || "Journal"} · {p.published_date ? "Published" : "Draft"}</p>
            <p className="font-serif text-lg text-primary">{p.title}</p>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEditing({ ...p, published: !!p.published_date })} className="touch-min flex-1 rounded-md border border-input text-sm"><Pencil className="mx-auto h-4 w-4" /></button>
              <button onClick={() => remove(p.id)} className="touch-min flex-1 rounded-md border border-input text-sm text-destructive"><Trash2 className="mx-auto h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
            <h2 className="font-serif text-2xl text-primary">{editing.id ? "Edit post" : "New post"}</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm"><span>Title</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm"><span>Category</span><input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
                <label className="text-sm"><span>Author</span><input value={editing.author || ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
              </div>
              <label className="block text-sm"><span>Featured image URL</span><input value={editing.featured_image || ""} onChange={(e) => setEditing({ ...editing, featured_image: e.target.value })} className="mt-1 touch-min w-full rounded-md border border-input bg-background px-3" /></label>
              <label className="block text-sm"><span>Excerpt</span><textarea rows={2} value={editing.excerpt || ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background p-2" /></label>
              <label className="block text-sm"><span>Content</span><textarea rows={10} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background p-2" /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Publish now</label>
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
