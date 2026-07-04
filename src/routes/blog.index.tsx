import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const postsQO = queryOptions({
  queryKey: ["posts", "published"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, excerpt, featured_image, published_date, category, seo_slug, author")
      .not("published_date", "is", null)
      .order("published_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Journal — Eshaal's Gulkari" },
      { name: "description", content: "Notes on hand embroidery, craft, and care from the Eshaal's Gulkari studio." },
      { property: "og:title", content: "Journal — Eshaal's Gulkari" },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQO),
  component: BlogIndex,
});

function BlogIndex() {
  const { data: posts } = useSuspenseQuery(postsQO);
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
      <header className="mb-10 text-center md:mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Journal</p>
        <h1 className="mt-3 font-serif text-4xl text-primary md:text-5xl">Notes from the studio</h1>
      </header>
      {posts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Nothing published yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} to="/blog/$slug" params={{ slug: p.seo_slug }} className="group block">
              {p.featured_image && (
                <div className="overflow-hidden rounded-md">
                  <img src={p.featured_image} alt={p.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                </div>
              )}
              <p className="mt-3 text-xs uppercase tracking-wider text-accent">{p.category ?? "Journal"}</p>
              <h2 className="mt-1 font-serif text-xl text-primary group-hover:text-accent">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
              <p className="mt-2 text-xs text-muted-foreground">{p.published_date ? new Date(p.published_date).toLocaleDateString() : ""}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
