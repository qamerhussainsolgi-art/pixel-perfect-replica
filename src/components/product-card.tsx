import { Link } from "@tanstack/react-router";
import { formatPKR } from "@/lib/cart";

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  collection: string;
  images: string[];
  seo_slug: string;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const img = product.images?.[0] ?? "/images/summer.jpg";
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.seo_slug }}
      className="group block"
    >
      <div className="overflow-hidden rounded-md bg-secondary transition-shadow duration-300 hover:shadow-lg">
        <div className="aspect-[4/5] overflow-hidden">
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-accent">{product.collection}</p>
        <h3 className="font-serif text-lg leading-tight text-foreground group-hover:text-primary">{product.name}</h3>
        <p className="text-sm font-medium text-foreground/80">{formatPKR(product.price)}</p>
      </div>
    </Link>
  );
}
