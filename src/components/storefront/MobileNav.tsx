"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Drawer } from "@/components/ui/Drawer";
import { useUI } from "@/stores/ui";
import { useCategories } from "@/lib/api/hooks/catalog";

export function MobileNav() {
  const t = useTranslations("nav");
  const open = useUI((s) => s.mobileNavOpen);
  const close = useUI((s) => s.closeMobileNav);
  const { data: categories } = useCategories();

  return (
    <Drawer open={open} onClose={close} title={t("catalog")} side="left">
      <nav className="flex flex-col p-3">
        <Link href="/" onClick={close} className="rounded-r-md px-3 py-2.5 text-sm font-medium text-navy hover:bg-card">
          {t("home")}
        </Link>
        {categories?.map((c) => (
          <Link key={c.id} href={`/c/${c.slug}`} onClick={close} className="rounded-r-md px-3 py-2.5 text-sm text-navy hover:bg-card">
            {c.name}
          </Link>
        ))}
      </nav>
    </Drawer>
  );
}
