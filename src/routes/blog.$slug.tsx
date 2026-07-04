import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const postQO = (slug: string) => queryOptions({
  queryKey: ["post", slug],
  queryFn: async () => {
    const { data, error } = await supabase.from("blog_posts").select("*").eq("seo_slug", slug).maybeSingle();
    if (error) throw error;
    if (!data || !data.published_date) throw notFound();
    return data;
  },
});

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(postQO(params.slug)),
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Post not found" }, { name: "robots", content: "noindex" }] };
    const p = loaderData as any;
    return {
      meta: [
        { title: `${p.seo_title || p.title} — Eshaal's Gulkari` },
        { name: "description", content: p.seo_description || p.excerpt || "" },
        { property: "og:title", content: p.title },
        { property: "og:description", content: p.excerpt || "" },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/blog/${params.slug}` },
        ...(p.featured_image ? [{ property: "og:image" as const, content: p.featured_image }] : []),
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: p.title,
          datePublished: p.published_date,
          author: { "@type": "Person", name: p.author },
          image: p.featured_image ? [p.featured_image] : undefined,
        }),
      }],
    };
  },
  component: BlogPost,
  notFoundComponent: () => (
    <div className="mx-auto max-w-[600px] px-4 py-24 text-center">
      <h1 className="font-serif text-3xl text-primary">Post not found</h1>
      <Link to="/blog" className="mt-4 inline-block text-primary underline">Back to journal</Link>
    </div>
  ),
});

function BlogPost() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(postQO(slug));
  return (
    <article className="mx-auto max-w-[680px] px-4 py-10 md:px-6 md:py-16">
      <Link to="/blog" className="text-xs uppercase tracking-wider text-accent">← Journal</Link>
      <h1 className="mt-4 font-serif text-3xl leading-tight text-primary md:text-5xl">{p.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{p.author} · {p.published_date ? new Date(p.published_date).toLocaleDateString() : ""}</p>
      {p.featured_image && (
        <img src={p.featured_image} alt={p.title} className="mt-6 aspect-[16/10] w-full rounded-md object-cover" />
      )}
      <div className="prose mt-8 max-w-none text-base leading-relaxed text-foreground/85">
        {p.content.split(/\n\n+/).map((para: string, i: number) => <p key={i} className="mb-5">{para}</p>)}
      </div>
    </article>
  );
}
