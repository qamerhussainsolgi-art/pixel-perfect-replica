import { Link } from "@tanstack/react-router";
import { formatPKR } from "@/lib/cart";
import { calculateFinalPrice } from "@/lib/price";

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  discount_percentage?: number | null;
  collection?: string;
  images: string[];
  seo_slug: string;
  image_url_1?: string | null;
  seasonal_category?: { name: string } | null;
  product_type_category?: { name: string } | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const img = product.image_url_1 ?? product.images?.[0] ?? "/images/summer.jpg";
  const finalPrice = calculateFinalPrice(product.price, product.discount_percentage);
  const hasDiscount = product.discount_percentage && product.discount_percentage > 0;

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
            alt={`Hand-embroidered model piece: ${product.name}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex gap-1.5 items-center flex-wrap">
          {product.seasonal_category?.name && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-accent">
              {product.seasonal_category.name}
            </span>
          )}
          {product.product_type_category?.name && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              · {product.product_type_category.name}
            </span>
          )}
        </div>
        <h3 className="font-serif text-lg leading-tight text-foreground group-hover:text-primary">{product.name}</h3>
        <div className="flex flex-wrap items-baseline gap-2 mt-1">
          {hasDiscount ? (
            <>
              <span className="text-sm font-semibold text-primary">{formatPKR(finalPrice)}</span>
              <span className="text-xs text-muted-foreground line-through opacity-70">{formatPKR(product.price)}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-accent">({product.discount_percentage}% off)</span>
            </>
          ) : (
            <span className="text-sm font-medium text-foreground/80">{formatPKR(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}