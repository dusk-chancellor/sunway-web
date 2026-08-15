"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Money } from "@/components/shared/Money";
import { cn } from "@/lib/utils/cn";
import type { NasiyaQuote, NasiyaTariff } from "@/lib/validation/schemas";

/**
 * The installments panel at checkout. Unlike a card payment, this method has to
 * be qualified for: Uzum answers with the customer's state first, and only a
 * verified customer ever sees a price.
 *
 * Three outcomes, and each deserves its own wording:
 *   ready        — pick a plan, see the monthly payment
 *   registration — finish registration in Uzum's own WebView; the status code
 *                  names the exact missing document, which converts far better
 *                  than a generic "finish registration"
 *   blocked      — issuance is impossible. Code 14 is vendor-specific: the
 *                  customer is fine elsewhere, just not with us, so it is never
 *                  phrased as a rejection of them.
 */

interface Props {
  quote: NasiyaQuote | undefined;
  isLoading: boolean;
  error: Error | null;
  selected: string | null;
  onSelect: (tariff: string) => void;
  currency: string;
}

export function NasiyaPanel({ quote, isLoading, error, selected, onSelect, currency }: Props) {
  const t = useTranslations("nasiya");
  const locale = useLocale();

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 rounded-r-md bg-card px-3 py-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> {t("checking")}
      </p>
    );
  }
  if (error || !quote) {
    // Deliberately not the server's own words. Anything that fails here — the
    // gateway switched off in config, Uzum down, a rejected token — is our
    // problem, not the customer's, and "not found" tells them nothing they can
    // act on. The reasons a customer CAN act on arrive as buyer.state, below.
    return <Notice tone="bad">{t("unavailable")}</Notice>;
  }

  const { buyer, tariffs } = quote;

  if (buyer.state === "blocked") {
    return <Notice tone="bad">{statusMessage(t, buyer.statusCode, "blocked")}</Notice>;
  }

  if (buyer.state === "registration") {
    return (
      <div className="space-y-3">
        <Notice tone="warn">{statusMessage(t, buyer.statusCode, "registration")}</Notice>
        {buyer.webviewUrl && (
          <a
            href={buyer.webviewUrl}
            className="inline-flex h-11 items-center gap-2 rounded-r-md bg-navy px-5 text-sm font-medium text-white hover:bg-navy-2"
          >
            {t("openRegistration")} <ExternalLink className="h-4 w-4" />
          </a>
        )}
        <p className="text-xs text-muted">{t("registrationHint")}</p>
      </div>
    );
  }

  const usable = tariffs.filter((x) => x.isAvailable);
  if (usable.length === 0) {
    // Verified, but nothing on offer for this cart — in practice the total is
    // above the customer's remaining limit. Uzum sends an explanation, but only
    // ever in Russian, so it is shown to Russian readers and translated for
    // everyone else.
    const reason = tariffs.find((x) => x.errorMessage)?.errorMessage;
    return <Notice tone="warn">{(locale === "ru" && reason) || t("overLimit")}</Notice>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("choosePlan")}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {tariffs.map((plan) => (
          <PlanCard
            key={plan.tariff}
            plan={plan}
            locale={locale}
            currency={currency}
            selected={selected === plan.tariff}
            onSelect={() => onSelect(plan.tariff)}
          />
        ))}
      </div>
      {buyer.hasOverdueContracts && <Notice tone="warn">{t("hasOverdue")}</Notice>}
      <p className="rounded-r-md bg-card px-3 py-2 text-sm text-muted">{t("signingNotice")}</p>
    </div>
  );
}

function PlanCard({
  plan,
  locale,
  currency,
  selected,
  onSelect,
}: {
  plan: NasiyaTariff;
  locale: string;
  currency: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("nasiya");
  const title = locale === "uz" ? plan.titleUz : plan.titleRu;
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!plan.isAvailable}
      aria-pressed={selected}
      className={cn(
        "rounded-r-md border p-3 text-left text-sm transition",
        selected ? "border-navy ring-2 ring-navy/30" : "border-line hover:border-navy/40",
        !plan.isAvailable && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-navy">{title || t("months", { count: plan.periodMonths })}</span>
        {plan.markupPercent > 0 && <span className="text-xs text-muted">+{plan.markupPercent}%</span>}
      </span>
      <span className="mt-1 block text-base font-semibold text-navy">
        <Money minor={plan.monthlyMinor} currency={currency} />
        <span className="text-xs font-normal text-muted"> / {t("perMonth")}</span>
      </span>
      <span className="mt-1 block text-xs text-muted">
        {t("totalWithMarkup")}: <Money minor={plan.totalMinor} currency={currency} />
      </span>
      {/* Same rule as the panel notice: their text is Russian-only. */}
      {!plan.isAvailable && plan.errorMessage && locale === "ru" && (
        <span className="mt-1 block text-xs text-bad">{plan.errorMessage}</span>
      )}
    </button>
  );
}

function Notice({ tone, children }: { tone: "warn" | "bad"; children: React.ReactNode }) {
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-r-md px-3 py-2 text-sm",
        tone === "bad" ? "bg-bad-soft text-bad" : "bg-warn-soft/60 text-navy",
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

// statusMessage maps Uzum's user-status enum onto a message key. The specific
// ones name a document; anything unrecognised falls back to the generic line
// for its group — an unknown code is never treated as permission to proceed.
function statusMessage(
  t: ReturnType<typeof useTranslations<"nasiya">>,
  code: number,
  group: "registration" | "blocked",
): string {
  const keys: Record<number, string> = {
    0: "status0",
    1: "status1",
    2: "status2",
    5: "status5",
    8: "status8",
    9: "status9",
    10: "status10",
    11: "status11",
    12: "status12",
    13: "status13",
    14: "status14",
    403: "status403",
  };
  const key = keys[code];
  if (key) return t(key);
  return group === "registration" ? t("statusRegistration") : t("statusBlocked");
}
