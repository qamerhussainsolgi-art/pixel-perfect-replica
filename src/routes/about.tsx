import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Eshaal's Gulkari" },
      {
        name: "description",
        content: "Learn about the hand embroidery craft of Eshaal's Gulkari, owned by Tazeen Faisal Khan. Discover our seasonal Summer, Winter, and Luxury collections.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-14">
      <section className="relative overflow-hidden py-10 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Our Heritage</p>
          <h1 className="mt-4 font-serif text-4xl leading-[1.1] text-primary md:text-6xl">
            Hand-Embroidered,
            <br />
            <span className="italic text-accent">Made with Care</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-foreground/85 md:text-lg">
            Eshaal's Gulkari brings handcrafted embroidery to everyday and luxury wear — producing exquisite lawn shirts, pure chiffon suits, and winter shawls, each finished by hand with absolute care.
          </p>
        </div>
      </section>

      <hr className="stitch-divider my-8" />

      <section className="grid gap-10 py-10 md:grid-cols-2 md:items-center md:py-16">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent">The Art of Gulkari</p>
          <h2 className="mt-3 font-serif text-3xl text-primary md:text-4xl">Our Craft Philosophy</h2>

          <div className="mt-6 space-y-6 text-sm text-foreground/80 md:text-base leading-relaxed">
            <p>
              At the heart of Eshaal's Gulkari is the traditional art of hand embroidery. We focus on delicate <strong>cross-stitch work</strong> and intricate <strong>tarkashi</strong> (drawn-thread threadwork), which are performed with patience and steady hands.
            </p>
            <p>
              To maintain the integrity of our hand embroidery work, our catalog is organized thoughtfully by season:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Summer Collection:</strong> Breathable, lightweight lawn and cotton net suits featuring floral work designed for warm weather comfort.</li>
              <li><strong>Winter Collection:</strong> Pure wool shawls and embroidery designed to offer comforting warmth throughout the cold months.</li>
              <li><strong>Luxury Collection:</strong> Hand-embroidered silk and pure chiffon suits with elaborate embellishments, designed for special occasions.</li>
            </ul>
            <p>
              This seasonal classification allows us to offer pieces suited for the right occasion, at a price range that fits the customer's budget and respects the intricate skill.
            </p>
          </div>
        </div>

        <div className="relative order-first md:order-last">
          <div className="absolute -inset-3 stitch-border" />
          <img
            src="/images/craft-story.jpg"
            alt="Intricate embroidery threadwork by hand"
            className="relative aspect-square w-full rounded-md object-cover shadow-md"
            loading="lazy"
          />
        </div>
      </section>

      <section className="rounded-lg bg-secondary/30 p-6 md:p-10 border border-border">
        <div className="mx-auto max-w-3xl text-center">
          <Heart className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-4 font-serif text-2xl text-primary md:text-3xl">Tazeen Faisal Khan</h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/80">
            Eshaal's Gulkari is owned and founded by Tazeen Faisal Khan, who directs the brand.
          </p>
          <div className="mx-auto mt-4 max-w-md text-xs text-muted-foreground/80">
            [PLACEHOLDER: founder bio details]
          </div>
        </div>
      </section>

      <section className="py-12 text-center md:py-20">
        <div className="mx-auto max-w-xl">
          <Sparkles className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-4 font-serif text-2xl md:text-4xl text-primary">Discover the Collections</h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Browse our carefully classified seasonal pieces, from light everyday linen to magnificent chiffon suits.
          </p>
          <div className="mt-8">
            <Link
              to="/collections"
              className="inline-flex touch-min items-center rounded-md bg-primary px-7 text-sm font-medium tracking-wide text-primary-foreground transition-transform hover:scale-[1.02] hover:opacity-95"
            >
              Explore Collections
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
