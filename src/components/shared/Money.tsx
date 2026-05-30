import { formatMoney, type MinorUnits } from "@/lib/format/money";

/** Renders a bigint minor-unit value as a localized currency string. */
export function Money({ minor, currency = "UZS", className }: { minor: MinorUnits; currency?: string; className?: string }) {
  return <span className={className}>{formatMoney(minor, currency)}</span>;
}
