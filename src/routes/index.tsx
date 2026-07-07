import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { COLLECTION_IMAGE, COLLECTION_LABEL, COLLECTION_PRICE, COLLECTION_TAGLINE, PriceBadge } from "@/components/price-badge";

const featuredQO = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, collection, images, seo_slug")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(4);
    if (error) throw error;
    return (data ?? []) as ProductCardData[];
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eshaal's Gulkari | Hand-Embroidered Luxury Apparel" },
      { name: "description", content: "Delicate cross-stitch and floral craft. Discover our hand-embroidered lawn, chiffon, and wool shawl collections." },
      { property: "og:title", content: "Eshaal's Gulkari | Hand-Embroidered Luxury Apparel" },
      { property: "og:description", content: "Delicate cross-stitch and floral craft. Discover our hand-embroidered lawn, chiffon, and wool shawl collections." },
      { property: "og:url", content: "https://eshaalsgulkari.com" },
      { property: "og:image", content: "https://eshaalsgulkari.com/images/luxury.jpg" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredQO),
  component: RootIndexPage,
});

function RootIndexPage() {
  const { data: items } = useSuspenseQuery(featuredQO);
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
      <section className="relative overflow-hidden py-10 md:py-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Handcrafted Heritage</p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.1] text-primary md:text-6xl">
          Eshaal's Gulkari
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-foreground/85 md:text-lg">
          Delicate, authentic hand-embroidered apparel constructed carefully for every season.
        </p>
      </section>

      <section className="py-8">
        <div className="mb-6 flex items-baseline justify-between border-b border-dashed border-lavender/60 pb-4">
          <h2 className="font-serif text-2xl text-primary">Featured Pieces</h2>
          <Link to="/collections" className="text-xs uppercase tracking-wider text-accent hover:underline">View All →</Link>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No featured pieces available at this moment.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}