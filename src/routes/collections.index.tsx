import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { COLLECTION_LABEL, COLLECTION_PRICE, PriceBadge } from "@/components/price-badge";

const allProductsQO = queryOptions({
  queryKey: ["products", "all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, collection, images, seo_slug")
      .order("collection")
      .order("price");
    if (error) throw error;
    return (data ?? []) as ProductCardData[];
  },
});

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title: "All Collections — Eshaal's Gulkari" },
      { name: "description", content: "Explore Summer, Winter, and Luxury hand-embroidered kurta collections from Eshaal's Gulkari by Tazeen Faisal." },
      { property: "og:title", content: "All Collections — Eshaal's Gulkari" },
      { property: "og:description", content: "Summer, Winter, and Luxury hand-embroidered kurtas." },
      { property: "og:url", content: "/collections" },
    ],
    links: [{ rel: "canonical", href: "/collections" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(allProductsQO),
  component: CollectionsPage,
});

function CollectionsPage() {
  const { data: products } = useSuspenseQuery(allProductsQO);
  const groups = (["summer", "winter", "luxury"] as const).map((c) => ({
    key: c,
    items: products.filter((p) => p.collection === c),
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
      <header className="mb-10 text-center md:mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Our work</p>
        <h1 className="mt-3 font-serif text-4xl text-primary md:text-5xl">Collections</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
          Three worlds of embroidery, each with its own weight and pace.
        </p>
      </header>

      {/* filter tabs */}
      <nav className="mb-12 flex flex-wrap items-center justify-center gap-2 md:gap-3">
        <a href="#all" className="touch-min inline-flex items-center rounded-full border border-dashed border-lavender bg-background px-5 text-sm text-primary hover:bg-secondary">All</a>
        {(["summer", "winter", "luxury"] as const).map((c) => (
          <Link key={c} to="/collections/$category" params={{ category: c }} className="touch-min inline-flex items-center rounded-full border border-dashed border-lavender bg-background px-5 text-sm text-primary hover:bg-secondary">
            {COLLECTION_LABEL[c]}
          </Link>
        ))}
      </nav>

      <div id="all" className="space-y-16">
        {groups.map((g, i) => (
          <section key={g.key}>
            {i > 0 && <hr className="stitch-divider mb-16" />}
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-serif text-3xl text-primary">{COLLECTION_LABEL[g.key]}</h2>
              <PriceBadge label={COLLECTION_PRICE[g.key]} />
            </div>
            {g.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Coming soon.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {g.items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
