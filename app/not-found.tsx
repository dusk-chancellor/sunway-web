import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="font-display text-7xl font-bold text-yellow">404</p>
        <h1 className="text-2xl font-display text-navy">{t("notFoundTitle")}</h1>
        <p className="max-w-md text-muted">{t("notFoundBody")}</p>
        <Link href="/" className="mt-2 inline-flex h-11 items-center rounded-r-md bg-navy px-6 text-sm font-medium text-white hover:bg-navy-2">
          {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
