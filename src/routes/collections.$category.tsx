import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { COLLECTION_LABEL, COLLECTION_PRICE, COLLECTION_TAGLINE, PriceBadge } from "@/components/price-badge";

const VALID = ["summer", "winter", "luxury"] as const;
type Cat = typeof VALID[number];

const byCatQO = (cat: Cat) => queryOptions({
  queryKey: ["products", "cat", cat],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, collection, images, seo_slug")
      .eq("collection", cat)
      .order("price");
    if (error) throw error;
    return (data ?? []) as ProductCardData[];
  },
});

export const Route = createFileRoute("/collections/$category")({
  loader: ({ context, params }) => {
    if (!VALID.includes(params.category as Cat)) throw notFound();
    return context.queryClient.ensureQueryData(byCatQO(params.category as Cat));
  },
  head: ({ params }) => {
    const cat = params.category as Cat;
    const label = COLLECTION_LABEL[cat] ?? "Collection";
    return {
      meta: [
        { title: `${label} Collection — Eshaal's Gulkari` },
        { name: "description", content: `${label} hand-embroidered kurtas. ${COLLECTION_TAGLINE[cat] ?? ""}` },
        { property: "og:title", content: `${label} Collection — Eshaal's Gulkari` },
        { property: "og:description", content: COLLECTION_TAGLINE[cat] ?? "" },
        { property: "og:url", content: `/collections/${cat}` },
        { property: "og:image", content: `/images/${cat}.jpg` },
      ],
      links: [{ rel: "canonical", href: `/collections/${cat}` }],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-[600px] px-4 py-24 text-center">
      <h1 className="font-serif text-3xl text-primary">Collection not found</h1>
      <Link to="/collections" className="mt-4 inline-block text-primary underline">Back to collections</Link>
    </div>
  ),
});

function CategoryPage() {
  const { category } = Route.useParams();
  const cat = category as Cat;
  const { data: items } = useSuspenseQuery(byCatQO(cat));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
      <header className="mb-10 md:mb-14">
        <Link to="/collections" className="text-xs uppercase tracking-[0.3em] text-accent hover:text-primary">← All collections</Link>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-serif text-4xl text-primary md:text-5xl">{COLLECTION_LABEL[cat]}</h1>
          <PriceBadge label={COLLECTION_PRICE[cat]} />
        </div>
        <p className="mt-3 max-w-lg text-sm text-muted-foreground">{COLLECTION_TAGLINE[cat]}</p>
      </header>
      <hr className="stitch-divider mb-10" />
      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Coming soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
