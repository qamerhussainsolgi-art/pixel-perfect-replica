import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { formatPKR, useCart } from "@/lib/cart";
import { calculateFinalPrice } from "@/lib/price";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const productQO = (slug: string) => queryOptions({
  queryKey: ["product", slug],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, seasonal_category:seasonal_categories(name), product_type_category:product_type_categories(name)")
      .eq("seo_slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data;
  },
});

export const Route = createFileRoute("/product/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQO(params.slug)),
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

  const imageSources = [p.image_url_1, p.image_url_2, p.image_url_3, p.image_url_4].filter(Boolean) as string[];
  const images = imageSources.length > 0 ? imageSources : ((p.images && p.images.length > 0) ? p.images : ["/images/summer.jpg"]);

  const finalPrice = calculateFinalPrice(Number(p.price), p.discount_percentage);
  const hasDiscount = p.discount_percentage && p.discount_percentage > 0;

  function addToCart(goToCart = false) {
    add({ product_id: p.id, slug: p.seo_slug, name: p.name, price: finalPrice, image: images[0] });
    toast.success("Added to cart");
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 pb-24 md:px-8 md:py-14">
      <div className="grid gap-8 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-7">
          <div className="overflow-hidden rounded-md bg-secondary">
            <img src={images[active]} alt={p.name} className="aspect-[4/5] w-full object-cover transition-all duration-300" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded transition-all cursor-pointer ${
                    i === active ? "ring-2 ring-primary scale-95" : "ring-1 ring-border opacity-70"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-5">
          <div className="flex gap-2 flex-wrap items-center">
            {p.seasonal_category?.name && (
              <span className="inline-flex items-center rounded-full border border-dashed border-lavender bg-background px-3 py-1 text-xs uppercase tracking-wider text-primary">
                {p.seasonal_category.name}
              </span>
            )}
            {p.product_type_category?.name && (
              <span className="inline-flex items-center rounded-full border border-dashed border-lavender bg-background px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
                {p.product_type_category.name}
              </span>
            )}
          </div>

          <h1 className="mt-4 font-serif text-3xl leading-tight text-primary md:text-4xl">{p.name}</h1>

          {hasDiscount ? (
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-bold text-primary">{formatPKR(finalPrice)}</span>
              <span className="text-lg text-muted-foreground line-through opacity-70">{formatPKR(Number(p.price))}</span>
              <span className="rounded bg-accent px-2 py-0.5 text-xs uppercase font-bold text-accent-foreground tracking-wider">
                {p.discount_percentage}% OFF
              </span>
            </div>
          ) : (
            <p className="mt-3 text-2xl font-medium text-foreground">{formatPKR(Number(p.price))}</p>
          )}

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

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
        <button onClick={() => addToCart(false)} className="touch-min w-full rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground">
          Add to cart · {formatPKR(finalPrice)}
        </button>
      </div>
    </div>
  );
}