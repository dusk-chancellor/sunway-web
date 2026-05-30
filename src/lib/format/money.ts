/**
 * Money is a bigint of *minor units* (tiyin: 100 tiyin = 1 so'm) everywhere in
 * transit and in app state. It is only turned into a human string here, at the
 * render boundary. Never parseFloat a price; add prices with bigint arithmetic.
 */
export type MinorUnits = bigint;

const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "UZS";

/** Number of minor units per major unit, per ISO 4217. UZS uses 2 (tiyin). */
function minorDigits(currency: string): number {
  switch (currency) {
    case "UZS":
      return 2;
    default:
      return 2;
  }
}

export function formatMoney(
  minor: MinorUnits,
  currency: string = DEFAULT_CURRENCY,
  locale = "en",
): string {
  const digits = minorDigits(currency);
  const divisor = 10 ** digits;
  const major = Number(minor) / divisor;

  // UZS is conventionally shown without decimals and with a "so'm" suffix,
  // which Intl renders correctly with maximumFractionDigits: 0.
  const fractionDigits = currency === "UZS" ? 0 : digits;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    }).format(major);
  } catch {
    return `${major.toLocaleString(locale)} ${currency}`;
  }
}

/** Sum a list of minor-unit values with bigint arithmetic. */
export function sumMinor(values: MinorUnits[]): MinorUnits {
  return values.reduce((acc, v) => acc + v, 0n);
}
