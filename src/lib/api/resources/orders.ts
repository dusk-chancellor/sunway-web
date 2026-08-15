import { apiFetch } from "../client";
import {
  orderSchema,
  orderListSchema,
  type Order,
  type OrderList,
  type PaymentMethod,
  type OnlinePaymentMethod,
} from "@/lib/validation/schemas";

export interface PlaceOrderInput {
  shippingAddressId?: string; // omitted for pickup orders
  shippingMethodId: string;
  paymentMethod: PaymentMethod;
  locale: string; // language for the delivery-notification SMS
  // The installment plan chosen from the quote. Required for uzum_nasiya,
  // ignored by every other method.
  nasiyaTariff?: string;
}

export async function fetchOrders(): Promise<OrderList> {
  return orderListSchema.parse(await apiFetch(`/orders`));
}
export async function fetchOrder(number: string): Promise<Order> {
  return orderSchema.parse(await apiFetch(`/orders/${number}`));
}
export async function placeOrder(input: PlaceOrderInput, idempotencyKey: string): Promise<Order> {
  return orderSchema.parse(await apiFetch(`/orders`, { method: "POST", body: input, idempotencyKey }));
}
export async function cancelOrder(number: string): Promise<Order> {
  return orderSchema.parse(await apiFetch(`/orders/${number}/cancel`, { method: "POST" }));
}

// Re-issues a checkout redirect for an unpaid order (retry after an abandoned
// or declined payment). For installments this resumes the existing contract
// when one is still open, rather than opening a second credit agreement.
export async function retryOrderPayment(
  number: string,
  paymentMethod: OnlinePaymentMethod,
  nasiyaTariff?: string,
): Promise<{ paymentRedirectUrl: string }> {
  return apiFetch(`/orders/${number}/pay`, {
    method: "POST",
    body: { paymentMethod, ...(nasiyaTariff ? { nasiyaTariff } : {}) },
  });
}

// Asks the backend to re-read the order's payment state from its gateway. This
// is what the customer's return from an installment WebView triggers: the
// return itself carries no proof of anything, and for Uzum Nasiya this call is
// what confirms the signed contract and marks the order paid.
export async function syncOrderPayment(number: string): Promise<Order> {
  return orderSchema.parse(await apiFetch(`/orders/${number}/sync-payment`, { method: "POST" }));
}
