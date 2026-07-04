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
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredQO),
  component: Home,
});

function Home() {
  const { data: featured } = useSuspenseQuery(featuredQO);

  return (
    <div>
      {/* HERO */}
      <section className="relative embroidery-bg overflow-hidden">
        <div className="mx-auto grid min-h-[70vh] max-w-[1200px] items-center gap-10 px-4 py-16 md:min-h-[80vh] md:grid-cols-2 md:px-8 md:py-24">
          <div className="order-2 md:order-1">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Hand-embroidered · Made with care</p>
            <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-primary md:text-6xl">
              Hand-Embroidered,
              <br />
              <span className="italic text-accent">Made with Care</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-foreground/75 md:text-lg">
              Eshaal's Gulkari brings handcrafted embroidery to everyday and luxury wear — from soft lawn shirts to pure chiffon suits and winter shawls, each piece finished by hand.
            </p>
            <div className="mt-8">
              <Link
                to="/collections"
                className="touch-min inline-flex items-center rounded-md bg-primary px-7 text-sm font-medium tracking-wide text-primary-foreground transition-transform hover:scale-[1.02] hover:opacity-95"
              >
                Explore Collections
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="relative">
              <div className="absolute -inset-3 stitch-border" />
              <img
                src="/images/hero-embroidery.jpg"
                alt="Deep plum kurta with gold embroidery"
                width={1600}
                height={1200}
                className="relative aspect-[4/3] w-full rounded-md object-cover shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTIONS PREVIEW */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
        <div className="mb-10 text-center md:mb-14">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Three collections</p>
          <h2 className="mt-3 font-serif text-3xl text-primary md:text-4xl">Choose your season</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {(["summer", "winter", "luxury"] as const).map((c) => (
            <Link
              key={c}
              to="/collections/$category"
              params={{ category: c }}
              className="group block"
            >
              <div className="overflow-hidden rounded-md">
                <img
                  src={COLLECTION_IMAGE[c]}
                  alt={`${COLLECTION_LABEL[c]} collection`}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <h3 className="font-serif text-2xl text-primary">{COLLECTION_LABEL[c]}</h3>
                <PriceBadge label={COLLECTION_PRICE[c]} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{COLLECTION_TAGLINE[c]}</p>
              <span className="mt-3 inline-block border-b border-dashed border-accent text-sm text-primary group-hover:text-accent">
                View Collection →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* STORY */}
      <section className="border-y border-dashed border-lavender/60 bg-secondary/40">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-8 md:py-24">
          <div className="relative">
            <div className="absolute -inset-3 stitch-border" />
            <img
              src="/images/craft-story.jpg"
              alt="Hands embroidering delicate lavender florals"
              loading="lazy"
              className="relative aspect-square w-full rounded-md object-cover"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Our craft</p>
            <h2 className="mt-3 font-serif text-3xl text-primary md:text-4xl">Hand embroidered, by season</h2>
            <p className="mt-5 text-base leading-relaxed text-foreground/80">
              Every piece at Eshaal's Gulkari is hand embroidered — from cross-stitch work on raw silk to detailed florals on lawn and chiffon.
            </p>
            <p className="mt-4 text-base leading-relaxed text-foreground/80">
              We keep our collections organized by season — Summer, Winter, and Luxury — so you can find the right piece for the right occasion, at a price range that fits.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Just added</p>
            <h2 className="mt-2 font-serif text-3xl text-primary md:text-4xl">Featured pieces</h2>
          </div>
          <Link to="/collections" className="hidden text-sm text-primary hover:text-accent md:inline">See all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-[1200px] px-4 py-16 text-center md:px-8 md:py-20">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-foreground/70">Ready when you are</p>
          <h2 className="mt-3 font-serif text-3xl md:text-5xl">Find the piece that feels like yours.</h2>
          <Link
            to="/collections"
            className="mt-8 touch-min inline-flex items-center rounded-md bg-primary-foreground px-8 text-sm font-medium text-primary hover:opacity-95"
          >
            Browse the collections
          </Link>
        </div>
      </section>
    </div>
  );
}
