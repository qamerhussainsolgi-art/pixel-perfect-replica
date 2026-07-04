import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );
        const [{ data: products }, { data: posts }] = await Promise.all([
          supabase.from("products").select("seo_slug, updated_at"),
          supabase.from("blog_posts").select("seo_slug, updated_at").not("published_date", "is", null),
        ]);
        const staticPaths = ["/", "/collections", "/collections/summer", "/collections/winter", "/collections/luxury", "/blog"];
        const urls: string[] = [];
        for (const p of staticPaths) urls.push(`<url><loc>${BASE_URL}${p}</loc><changefreq>weekly</changefreq></url>`);
        for (const p of products ?? []) urls.push(`<url><loc>${BASE_URL}/product/${p.seo_slug}</loc><lastmod>${p.updated_at}</lastmod></url>`);
        for (const p of posts ?? []) urls.push(`<url><loc>${BASE_URL}/blog/${p.seo_slug}</loc><lastmod>${p.updated_at}</lastmod></url>`);
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
