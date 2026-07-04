import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, User, Menu, X, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/auth-hook";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/", label: "Home" },
  { to: "/collections", label: "Collections" },
  { to: "/blog", label: "Journal" },
];

export function SiteHeader() {
  const { count } = useCart();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    supabase.rpc("current_is_admin", {}).then(({ data, error }) => {
      if (!cancelled) setIsAdmin(!!data && !error);
    });
    return () => { cancelled = true; };
  }, [user]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 md:px-8">
        <Link to="/" className="flex flex-col leading-tight">
          <span className="font-serif text-lg text-primary md:text-xl">Eshaal's Gulkari</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">by Tazeen Faisal</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm font-medium text-foreground/80 hover:text-primary" activeProps={{ className: "text-primary" }}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {user ? (
            <>
              <Link to="/account" className="hidden touch-min items-center gap-1.5 rounded-md px-3 text-sm hover:bg-secondary md:inline-flex">
                <User className="h-4 w-4" /> Account
              </Link>
              <button onClick={signOut} className="hidden touch-min items-center rounded-md px-3 text-sm hover:bg-secondary md:inline-flex">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden touch-min items-center gap-1.5 rounded-md px-3 text-sm hover:bg-secondary md:inline-flex">
              <User className="h-4 w-4" /> Sign in
            </Link>
          )}
          <Link to="/cart" className="relative touch-min inline-flex items-center justify-center rounded-md px-3 hover:bg-secondary" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <button onClick={() => setOpen(!open)} className="touch-min inline-flex items-center justify-center rounded-md px-3 md:hidden" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-[1200px] flex-col px-4 py-2">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="touch-min flex items-center border-b border-border/40 px-2 text-sm">
                {n.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/account" onClick={() => setOpen(false)} className="touch-min flex items-center border-b border-border/40 px-2 text-sm">Account</Link>
                <button onClick={() => { setOpen(false); signOut(); }} className="touch-min flex items-center px-2 text-left text-sm">Sign out</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="touch-min flex items-center px-2 text-sm">Sign in</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
