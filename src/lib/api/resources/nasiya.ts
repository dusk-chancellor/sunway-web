import { apiFetch } from "../client";
import {
  nasiyaBuyerSchema,
  nasiyaQuoteSchema,
  type NasiyaBuyer,
  type NasiyaQuote,
} from "@/lib/validation/schemas";

/**
 * Uzum Nasiya (installments) pre-order calls. Both are POSTs on the Go API and
 * both require a session: eligibility is answered for the caller's own verified
 * phone, never one supplied by the browser. The partner token that talks to
 * Uzum stays on the backend — this app never sees it.
 */

// Is this customer eligible, and which plans do they have? Cheap enough to call
// when the customer picks the installments tile at checkout.
export async function fetchNasiyaStatus(): Promise<NasiyaBuyer> {
  return nasiyaBuyerSchema.parse(await apiFetch(`/nasiya/status`, { method: "POST" }));
}

// Price the caller's current cart across their plans. Returns the buyer state
// too: an unverified customer has no prices to show, and the UI has to say why
// rather than render an empty list.
export async function fetchNasiyaQuote(): Promise<NasiyaQuote> {
  return nasiyaQuoteSchema.parse(await apiFetch(`/nasiya/quote`, { method: "POST" }));
}
