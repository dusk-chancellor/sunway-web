"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Image as ImageIcon, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils/cn";

export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const links = [
    { href: "/admin/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/admin/products", label: t("products"), icon: Package },
    { href: "/admin/categories", label: t("categories"), icon: FolderTree },
    { href: "/admin/orders", label: t("orders"), icon: ShoppingBag },
    { href: "/admin/banners", label: t("banners"), icon: ImageIcon },
  ];

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-line bg-white">
      <div className="border-b border-line p-4">
        <Logo href="/admin/dashboard" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((l) => {
          const active = pathname.startsWith(l.href);
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
      </nav>
      <button onClick={() => logout().then(() => router.push("/admin/login"))} className="m-3 flex items-center gap-3 rounded-r-md px-3 py-2.5 text-sm text-bad hover:bg-bad-soft">
        <LogOut className="h-4 w-4" /> {t("logout")}
      </button>
    </aside>
  );
}
