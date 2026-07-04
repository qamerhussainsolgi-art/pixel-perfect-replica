import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatPKR } from "@/lib/cart";
import { COLLECTION_LABEL } from "@/components/price-badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

const productQO = (slug: string) => queryOptions({
  queryKey: ["product", slug],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seo_slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data;
  },
});

export const Route = createFileRoute("/product/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQO(params.slug)),
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData as any;
    return {
      meta: [
        { title: `${p.seo_title || p.name} — Eshaal's Gulkari` },
        { name: "description", content: p.seo_description || p.description?.slice(0, 155) || "" },
        { property: "og:title", content: p.name },
        { property: "og:description", content: p.seo_description || p.description?.slice(0, 155) || "" },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/product/${params.slug}` },
        { property: "og:image", content: p.images?.[0] || "" },
      ],
      links: [{ rel: "canonical", href: `/product/${params.slug}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          image: p.images,
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
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-[600px] px-4 py-24 text-center">
      <h1 className="font-serif text-3xl text-primary">Piece not found</h1>
      <Link to="/collections" className="mt-4 inline-block text-primary underline">Back to collections</Link>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQO(slug));
  const [active, setActive] = useState(0);
  const { add } = useCart();
  const navigate = useNavigate();
  const images = (p.images && p.images.length > 0) ? p.images : ["/images/summer.jpg"];

  function addToCart(goToCart = false) {
    add({ product_id: p.id, slug: p.seo_slug, name: p.name, price: Number(p.price), image: images[0] });
    toast.success("Added to cart");
    if (goToCart) navigate({ to: "/cart" });
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 pb-24 md:px-8 md:py-14 md:pb-14">
      <div className="grid gap-8 md:grid-cols-12 md:gap-12">
        {/* Gallery */}
        <div className="md:col-span-7">
          <div className="overflow-hidden rounded-md bg-secondary">
            <img src={images[active]} alt={p.name} className="aspect-[4/5] w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded ${i === active ? "ring-2 ring-primary" : "ring-1 ring-border"}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:col-span-5">
          <Link to="/collections/$category" params={{ category: p.collection }} className="inline-flex items-center rounded-full border border-dashed border-lavender bg-background px-3 py-1 text-xs uppercase tracking-wider text-primary">
            {COLLECTION_LABEL[p.collection]}
          </Link>
          <h1 className="mt-4 font-serif text-3xl leading-tight text-primary md:text-4xl">{p.name}</h1>
          <p className="mt-3 text-2xl font-medium text-foreground">{formatPKR(Number(p.price))}</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-accent">
            {p.stock_status === "in_stock" ? "In stock" : "Made to order"}
          </p>

          {p.description && (
            <p className="mt-6 text-base leading-relaxed text-foreground/80">{p.description}</p>
          )}

          <div className="mt-8 hidden gap-3 md:flex">
            <button onClick={() => addToCart(false)} className="touch-min flex-1 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-95">
              Add to cart
            </button>
            <button onClick={() => addToCart(true)} className="touch-min flex-1 rounded-md border border-primary px-6 text-sm font-medium text-primary hover:bg-secondary">
              Order now
            </button>
          </div>

          <Accordion type="single" collapsible className="mt-8">
            {p.fabric && (
              <AccordionItem value="fabric"><AccordionTrigger>Fabric</AccordionTrigger><AccordionContent>{p.fabric}</AccordionContent></AccordionItem>
            )}
            {p.care && (
              <AccordionItem value="care"><AccordionTrigger>Care</AccordionTrigger><AccordionContent>{p.care}</AccordionContent></AccordionItem>
            )}
            {p.sizing && (
              <AccordionItem value="sizing"><AccordionTrigger>Sizing</AccordionTrigger><AccordionContent>{p.sizing}</AccordionContent></AccordionItem>
            )}
          </Accordion>
        </div>
      </div>

      {/* sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
        <button onClick={() => addToCart(false)} className="touch-min w-full rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground">
          Add to cart · {formatPKR(Number(p.price))}
        </button>
      </div>
    </div>
  );
}
