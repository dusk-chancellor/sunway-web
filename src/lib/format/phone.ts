import { parsePhoneNumberFromString, AsYouType } from "libphonenumber-js";

const DEFAULT_REGION = "UZ" as const;

/** True if the string is a valid phone number (default region UZ). */
export function isValidPhone(input: string): boolean {
  const p = parsePhoneNumberFromString(input, DEFAULT_REGION);
  return Boolean(p?.isValid());
}

/** Normalise to E.164 (+998901234567) for storage and transmission. */
export function toE164(input: string): string | null {
  const p = parsePhoneNumberFromString(input, DEFAULT_REGION);
  return p?.isValid() ? p.number : null;
}

/** Pretty international form (+998 90 123 45 67) for display. */
export function formatPhone(input: string): string {
  const p = parsePhoneNumberFromString(input, DEFAULT_REGION);
  return p ? p.formatInternational() : input;
}

/** Live formatting while the user types (used on input change). */
export function formatAsYouType(input: string): string {
  return new AsYouType(DEFAULT_REGION).input(input);
}
