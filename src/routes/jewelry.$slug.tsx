import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatPKR } from "@/lib/cart";
import { calculateFinalPrice } from "@/lib/price";
import { toast } from "sonner";

const jewelryQO = (slug: string) => queryOptions({
  queryKey: ["jewelry", slug],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("jewelry_products")
      .select("*")
      .eq("seo_slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data;
  },
});

export const Route = createFileRoute("/jewelry/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(jewelryQO(params.slug)),
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Jewelry piece not found" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData as any;
    const computedTitle = `${p.name} | Jewelry | Eshaal's Gulkari`;
    const canonicalUrl = `https://eshaalsgulkari.com/jewelry/${params.slug}`;
    const description = p.description?.slice(0, 155) || `${p.name} — handcrafted jewelry from Eshaal's Gulkari.`;
    return {
      meta: [
        { title: computedTitle },
        { name: "description", content: description },
        { property: "og:title", content: p.name },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: p.image_url_1 || "https://eshaalsgulkari.com/images/luxury.jpg" },
      ],
      links: [{ rel: "canonical", href: `/jewelry/${params.slug}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          image: [p.image_url_1, p.image_url_2, p.image_url_3, p.image_url_4].filter(Boolean),
          offers: {
            "@type": "Offer",
            priceCurrency: "PKR",
            price: p.price,
            availability: p.stock_status === "in_stock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }),
      }],
    };
  },
  component: JewelryDetailPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-[600px] px-4 py-24 text-center">
      <h1 className="font-serif text-3xl text-primary">Piece not found</h1>
      <Link to="/jewelry" className="mt-4 inline-block text-primary underline">Back to Jewelry</Link>
    </div>
  ),
});

function JewelryDetailPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(jewelryQO(slug));
  const [active, setActive] = useState(0);
  const { add } = useCart();
  const navigate = useNavigate();

  const images = [p.image_url_1, p.image_url_2, p.image_url_3, p.image_url_4].filter(Boolean) as string[];
  const galleryImages = images.length > 0 ? images : ["/images/luxury.jpg"];
  const finalPrice = calculateFinalPrice(Number(p.price), p.discount_percentage);
  const hasDiscount = p.discount_percentage && p.discount_percentage > 0;
  const outOfStock = p.stock_status === "out_of_stock";

  function addToCart(goToCart = false) {
    if (outOfStock) return;
    add({ product_id: p.id, slug: p.seo_slug, name: p.name, price: finalPrice, image: galleryImages[0] });
    toast.success("Added to cart");
    if (goToCart) navigate({ to: "/cart" });
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 pb-24 md:px-8 md:py-14 md:pb-14">
      <div className="grid gap-8 md:grid-cols-12 md:gap-12">
        {/* Gallery */}
        <div className="md:col-span-7">
          <div className="overflow-hidden rounded-md bg-secondary">
            <img src={galleryImages[active]} alt={`${p.name} - View ${active + 1}`} className="aspect-[4/5] w-full object-cover" />
          </div>
          {galleryImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded ${i === active ? "ring-2 ring-primary" : "ring-1 ring-border"}`}
                >
                  <img src={img} alt={`${p.name} - Thumbnail ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:col-span-5">
          <Link to="/jewelry" className="inline-flex items-center rounded-full border border-dashed border-lavender bg-background px-3 py-1 text-xs uppercase tracking-wider text-primary">
            Jewelry
          </Link>
          <h1 className="mt-4 font-serif text-3xl leading-tight text-primary md:text-4xl">{p.name}</h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            {hasDiscount ? (
              <>
                <span className="text-2xl font-medium text-foreground">{formatPKR(finalPrice)}</span>
                <span className="text-base text-muted-foreground line-through opacity-70">{formatPKR(Number(p.price))}</span>
                <span className="text-xs uppercase font-bold tracking-wider text-accent">({p.discount_percentage}% off)</span>
              </>
            ) : (
              <span className="text-2xl font-medium text-foreground">{formatPKR(Number(p.price))}</span>
            )}
          </div>

          <p className={`mt-1 text-xs uppercase tracking-wider ${outOfStock ? "text-destructive" : "text-accent"}`}>
            {outOfStock ? "Out of stock" : "In stock"}
          </p>

          {p.description && (
            <p className="mt-6 text-base leading-relaxed text-foreground/80">{p.description}</p>
          )}

          <div className="mt-8 hidden gap-3 md:flex">
            <button
              onClick={() => addToCart(false)}
              disabled={outOfStock}
              className="touch-min flex-1 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {outOfStock ? "Out of stock" : "Add to cart"}
            </button>
            <button
              onClick={() => addToCart(true)}
              disabled={outOfStock}
              className="touch-min flex-1 rounded-md border border-primary px-6 text-sm font-medium text-primary hover:bg-secondary disabled:opacity-50 disabled:pointer-events-none"
            >
              Order now
            </button>
          </div>
        </div>
      </div>

      {/* sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
        <button
          onClick={() => addToCart(false)}
          disabled={outOfStock}
          className="touch-min w-full rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-50 disabled:pointer-events-none"
        >
          {outOfStock ? "Out of stock" : `Add to cart · ${formatPKR(finalPrice)}`}
        </button>
      </div>
    </div>
  );
}
