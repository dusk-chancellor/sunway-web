"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, ShoppingCart, Heart, User, Menu } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useCart } from "@/lib/cart/useCart";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUI } from "@/stores/ui";
import { ClientOnly } from "@/components/shared/ClientOnly";

export function Header() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [q, setQ] = useState("");
  const { data: cart } = useCart();
  const { isAuthenticated } = useAuth();
  const openCart = useUI((s) => s.openCart);
  const toggleNav = useUI((s) => s.toggleMobileNav);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <button onClick={toggleNav} className="md:hidden text-navy" aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
        <Logo />
        <form onSubmit={submit} className="relative ml-2 hidden flex-1 md:block" role="search">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("catalog")}
            aria-label={t("catalog")}
            className="h-10 w-full rounded-r-md border border-line bg-card pl-9 pr-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy"
          />
        </form>
        <nav className="ml-auto flex items-center gap-1">
          <Link href="/search" className="md:hidden grid h-10 w-10 place-items-center rounded-r-md text-navy hover:bg-card" aria-label={t("catalog")}>
            <Search className="h-5 w-5" />
          </Link>
          {isAuthenticated && (
            <Link href="/account/wishlist" className="grid h-10 w-10 place-items-center rounded-r-md text-navy hover:bg-card" aria-label={t("wishlist")}>
              <Heart className="h-5 w-5" />
            </Link>
          )}
          <Link
            href={isAuthenticated ? "/account/profile" : "/login"}
            className="grid h-10 w-10 place-items-center rounded-r-md text-navy hover:bg-card"
            aria-label={isAuthenticated ? t("account") : t("login")}
          >
            <User className="h-5 w-5" />
          </Link>
          <button onClick={openCart} className="relative grid h-10 w-10 place-items-center rounded-r-md text-navy hover:bg-card" aria-label={t("cart")}>
            <ShoppingCart className="h-5 w-5" />
            <ClientOnly>
              {cart && cart.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-yellow px-1 text-[11px] font-bold text-navy">
                  {cart.count}
                </span>
              )}
            </ClientOnly>
          </button>
        </nav>
      </div>
    </header>
  );
}
