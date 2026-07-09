import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/cart";
import { calculateFinalPrice } from "@/lib/price";

interface JewelryCardData {
  id: string;
  name: string;
  price: number;
  discount_percentage: number | null;
  image_url_1: string | null;
  stock_status: string;
  seo_slug: string;
}

const jewelryListQO = queryOptions({
  queryKey: ["jewelry", "list"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("jewelry_products")
      .select("id, name, price, discount_percentage, image_url_1, stock_status, seo_slug")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as JewelryCardData[];
  },
});

export const Route = createFileRoute("/jewelry/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(jewelryListQO),
  head: () => ({
    meta: [
      { title: "Jewelry Collection | Eshaal's Gulkari" },
      { name: "description", content: "Hand-finished jewelry pieces from Eshaal's Gulkari — crafted to complement every outfit." },
      { property: "og:title", content: "Jewelry Collection | Eshaal's Gulkari" },
      { property: "og:description", content: "Hand-finished jewelry pieces from Eshaal's Gulkari — crafted to complement every outfit." },
      { property: "og:url", content: "https://eshaalsgulkari.com/jewelry" },
      { property: "og:image", content: "https://eshaalsgulkari.com/images/luxury.jpg" },
    ],
    links: [{ rel: "canonical", href: "/jewelry" }],
  }),
  component: JewelryListPage,
});

function JewelryCard({ item }: { item: JewelryCardData }) {
  const img = item.image_url_1 ?? "/images/luxury.jpg";
  const finalPrice = calculateFinalPrice(item.price, item.discount_percentage);
  const hasDiscount = item.discount_percentage && item.discount_percentage > 0;
  const outOfStock = item.stock_status === "out_of_stock";

  return (
    <Link
      to="/jewelry/$slug"
      params={{ slug: item.seo_slug }}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-md bg-secondary transition-shadow duration-300 hover:shadow-lg">
        <div className="aspect-[4/5] overflow-hidden">
          <img
            src={img}
            alt={item.name}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${outOfStock ? "opacity-60 grayscale-[30%]" : ""}`}
          />
        </div>
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
            Out of Stock
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-serif text-lg leading-tight text-foreground group-hover:text-primary">{item.name}</h3>
        <div className="flex flex-wrap items-baseline gap-2 mt-1">
          {hasDiscount ? (
            <>
              <span className="text-sm font-semibold text-primary">{formatPKR(finalPrice)}</span>
              <span className="text-xs text-muted-foreground line-through opacity-70">{formatPKR(item.price)}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-accent">({item.discount_percentage}% off)</span>
            </>
          ) : (
            <span className="text-sm font-medium text-foreground/80">{formatPKR(item.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function JewelryListPage() {
  const { data: items } = useSuspenseQuery(jewelryListQO);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
      <header className="mb-10 md:mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Handcrafted Pieces</p>
        <h1 className="mt-3 font-serif text-4xl text-primary md:text-5xl">Jewelry</h1>
        <p className="mt-3 max-w-lg text-sm text-muted-foreground">
          Hand-finished jewelry pieces, crafted to complement every outfit.
        </p>
      </header>
      <hr className="stitch-divider mb-10" />
      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Coming soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {items.map((item) => <JewelryCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
