import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="hairline" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">{t("blurb")}</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-navy">{t("company")}</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/about" className="hover:text-navy">{t("about")}</Link></li>
            <li><Link href="/contacts" className="hover:text-navy">{t("contacts")}</Link></li>
            <li><Link href="/delivery" className="hover:text-navy">{t("delivery")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-navy">{t("support")}</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/terms" className="hover:text-navy">{t("terms")}</Link></li>
            <li><Link href="/privacy" className="hover:text-navy">{t("privacy")}</Link></li>
            <li className="pt-1 text-navy">{tn("location")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} SUNWAY. {t("rights")}
      </div>
    </footer>
  );
}
