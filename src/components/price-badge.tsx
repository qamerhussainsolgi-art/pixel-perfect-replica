export function PriceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-dashed border-lavender/70 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
      {label}
    </span>
  );
}

export const COLLECTION_LABEL: Record<string, string> = {
  summer: "Summer",
  winter: "Winter",
  luxury: "Luxury",
};

export const COLLECTION_PRICE: Record<string, string> = {
  summer: "PKR 8,000 – 9,000",
  winter: "PKR 9,000 – 12,000",
  luxury: "PKR 40,000 +",
};

export const COLLECTION_IMAGE: Record<string, string> = {
  summer: "/images/summer.jpg",
  winter: "/images/winter.jpg",
  luxury: "/images/luxury.jpg",
};

export const COLLECTION_TAGLINE: Record<string, string> = {
  summer: "Lawn and cotton net suits — hand embroidered for everyday warmth.",
  winter: "Pure wool shawls — 30% off original price.",
  luxury: "Hand-embroidered silk and pure chiffon — 20% off original price.",
};