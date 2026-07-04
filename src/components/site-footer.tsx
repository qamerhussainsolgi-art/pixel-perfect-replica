import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-dashed border-lavender/60 bg-background">
      <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-14">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-serif text-xl text-primary">Eshaal's Gulkari</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">by Tazeen Faisal</p>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Hand-embroidered lawn, chiffon, and shawls — finished by hand, made with care.
            </p>
          </div>
          <div>
            <p className="font-serif text-sm uppercase tracking-wider text-foreground/70">Shop</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/collections/$category" params={{ category: "summer" }} className="hover:text-primary">Summer</Link></li>
              <li><Link to="/collections/$category" params={{ category: "winter" }} className="hover:text-primary">Winter</Link></li>
              <li><Link to="/collections/$category" params={{ category: "luxury" }} className="hover:text-primary">Luxury</Link></li>
              <li><Link to="/blog" className="hover:text-primary">Journal</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-serif text-sm uppercase tracking-wider text-foreground/70">Care</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>hello@eshaalsgulkari.com</li>
              <li>WhatsApp orders welcome</li>
              <li>Shipping across Pakistan</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-dashed border-lavender/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Eshaal's Gulkari by Tazeen Faisal. All rights reserved.</p>
          <p>Made with care, one stitch at a time.</p>
        </div>
      </div>
    </footer>
  );
}
