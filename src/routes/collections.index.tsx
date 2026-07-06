import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/product-card";
import { PriceBadge } from "@/components/price-badge";
import { calculateFinalPrice } from "@/lib/price";

const collectionsDataQO = queryOptions({
  queryKey: ["collectionsData"],
  queryFn: async () => {
    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, price, discount_percentage, images, seo_slug, image_url_1, seasonal_category_id, seasonal_category:seasonal_categories(name), product_type_category:product_type_categories(name)"),
      supabase.from("seasonal_categories").select("*").order("name"),
    ]);
    return {
      products: products ?? [],
      categories: categories ?? [],
    };
  },
});

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title: "All Collections — Eshaal's Gulkari" },
      { name: "description", content: "Explore our dynamic seasonal and product type categories of hand-embroidered clothing." },
    ],
    links: [{ rel: "canonical", href: "/collections" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(collectionsDataQO),
  component: CollectionsPage,
});

function CollectionsPage() {
  const { data } = useSuspenseQuery(collectionsDataQO);
  const { products, categories } = data;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
      <header className="mb-10 text-center md:mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">Our Work</p>
        <h1 className="mt-3 font-serif text-4xl text-primary md:text-5xl">Collections</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
          Timeless hand embroidery classified thoughtfully by season.
        </p>
      </header>

      <nav className="mb-12 flex flex-wrap items-center justify-center gap-2 md:gap-3">
        <a href="#all" className="touch-min inline-flex items-center rounded-full border border-dashed border-lavender bg-background px-5 text-sm text-primary hover:bg-secondary">All</a>
        {categories.map((c) => (
          <Link key={c.id} to="/collections/$category" params={{ category: c.name.toLowerCase() }} className="touch-min inline-flex items-center rounded-full border border-dashed border-lavender bg-background px-5 text-sm text-primary hover:bg-secondary">
            {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
          </Link>
        ))}
      </nav>

      <div id="all" className="space-y-16">
        {categories.map((cat, i) => {
          const catProducts = products.filter(p => p.seasonal_category_id === cat.id);
          const startingPrice = catProducts.length > 0
            ? Math.min(...catProducts.map(p => calculateFinalPrice(Number(p.price), p.discount_percentage)))
            : 0;

          return (
            <section key={cat.id}>
              {i > 0 && <hr className="stitch-divider mb-16" />}
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-serif text-3xl text-primary">{cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</h2>
                {startingPrice > 0 && (
                  <PriceBadge label={`Starting from Rs. ${new Intl.NumberFormat("en-PK").format(startingPrice)}`} />
                )}
              </div>
              {catProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Coming soon.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                  {catProducts.map((p: any) => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}