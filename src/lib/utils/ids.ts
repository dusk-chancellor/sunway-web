/**
 * ULID-ish, monotonic-enough id for Idempotency-Key / X-Request-ID headers.
 * Crockford base32, 26 chars, time-prefixed. No external dependency.
 */
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function ulid(): string {
  const time = Date.now();
  let timeChars = "";
  let t = time;
  for (let i = 0; i < 10; i++) {
    timeChars = ENCODING[t % 32] + timeChars;
    t = Math.floor(t / 32);
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let randChars = "";
  for (let i = 0; i < 16; i++) randChars += ENCODING[bytes[i]! % 32];
  return timeChars + randChars;
}
