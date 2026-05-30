"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { User, Package, Heart, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils/cn";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("account");
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isReady, logout } = useAuth();

  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isReady, isAuthenticated, router, pathname]);

  if (!isReady || !isAuthenticated) return null;

  const links = [
    { href: "/account/profile", label: t("profile"), icon: User },
    { href: "/account/orders", label: t("orders"), icon: Package },
    { href: "/account/wishlist", label: t("wishlist"), icon: Heart },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside>
          <nav className="flex flex-col gap-1">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "flex items-center gap-3 rounded-r-md px-3 py-2.5 text-sm",
                    active ? "bg-navy text-white" : "text-navy hover:bg-card",
                  )}
                >
                  <l.icon className="h-4 w-4" /> {l.label}
                </Link>
              );
            })}
            <button onClick={() => logout().then(() => router.push("/"))} className="mt-2 flex items-center gap-3 rounded-r-md px-3 py-2.5 text-left text-sm text-bad hover:bg-bad-soft">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
