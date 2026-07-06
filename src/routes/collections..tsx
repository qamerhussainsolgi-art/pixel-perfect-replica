import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/product-card";
import { PriceBadge } from "@/components/price-badge";
import { calculateFinalPrice } from "@/lib/price";

const categoryDataQO = (categoryName: string) => queryOptions({
  queryKey: ["categoryData", categoryName],
  queryFn: async () => {
    const { data: catData, error: catError } = await supabase
      .from("seasonal_categories")
      .select("*")
      .ilike("name", categoryName)
      .maybeSingle();

    if (catError) throw catError;
    if (!catData) throw notFound();

    const { data: productsData, error: prodError } = await supabase
      .from("products")
      .select("id, name, price, discount_percentage, images, seo_slug, image_url_1, seasonal_category_id, seasonal_category:seasonal_categories(name), product_type_category:product_type_categories(name)")
      .eq("seasonal_category_id", catData.id)
      .order("price");

    if (prodError) throw prodError;

    return {
      category: catData,
      products: productsData as any[],
    };
  },
});

export const Route = createFileRoute("/collections/")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(categoryDataQO(params.category)),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Collection not found" }, { name: "robots", content: "noindex" }] };
    }
    const { category } = loaderData as any;
    const label = category.name.charAt(0).toUpperCase() + category.name.slice(1);
    return {
      meta: [
        { title: `${label} Collection — Eshaal's Gulkari` },
        { name: "description", content: `Explore our hand-embroidered pieces in the ${label} collection.` },
      ],
      links: [{ rel: "canonical", href: `/collections/${category.name.toLowerCase()}` }],
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
  const { category: categoryParam } = Route.useParams();
  const { data } = useSuspenseQuery(categoryDataQO(categoryParam));
  const { category, products } = data;

  const label = category.name.charAt(0).toUpperCase() + category.name.slice(1);

  const startingPrice = products.length > 0
    ? Math.min(...products.map(p => calculateFinalPrice(Number(p.price), p.discount_percentage)))
    : 0;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
      <header className="mb-10 md:mb-14">
        <Link to="/collections" className="text-xs uppercase tracking-[0.3em] text-accent hover:text-primary">← All collections</Link>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-serif text-4xl text-primary md:text-5xl">{label}</h1>
          {startingPrice > 0 && (
            <PriceBadge label={`Starting from Rs. ${new Intl.NumberFormat("en-PK").format(startingPrice)}`} />
          )}
        </div>
      </header>
      <hr className="stitch-divider mb-10" />
      {products.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Coming soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
