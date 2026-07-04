import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/lib/admin-auth";

function DevOnly({ children }: { children: React.ReactNode }) {
  const { admin } = useAdmin();
  if (admin?.role !== "developer") return <div className="rounded-md border border-dashed border-destructive/40 p-6 text-sm text-destructive">Developer role required.</div>;
  return <>{children}</>;
}

export const Route = createFileRoute("/admin/seo")({
  component: () => (
    <DevOnly>
      <h1 className="font-serif text-3xl text-primary">SEO</h1>
      <hr className="stitch-divider my-6" />
      <div className="stitch-border rounded-lg bg-card p-6 text-sm">
        <p>Sitemap: <a className="text-primary underline" href="/sitemap.xml" target="_blank" rel="noreferrer">/sitemap.xml</a></p>
        <p className="mt-2">Robots: <a className="text-primary underline" href="/robots.txt" target="_blank" rel="noreferrer">/robots.txt</a></p>
        <p className="mt-4 text-muted-foreground">Per-product and per-post SEO titles and descriptions are editable from Products and Blog posts admin pages.</p>
      </div>
    </DevOnly>
  ),
});
