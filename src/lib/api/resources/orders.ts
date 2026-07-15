import { apiFetch } from "../client";
import { orderSchema, orderListSchema, type Order, type OrderList, type PaymentMethod } from "@/lib/validation/schemas";

export interface PlaceOrderInput {
  shippingAddressId?: string; // omitted for pickup orders
  shippingMethodId: string;
  paymentMethod: PaymentMethod;
  locale: string; // language for the delivery-notification SMS
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

// Re-issues a hosted-checkout redirect for an unpaid order (retry after an
// abandoned/declined Payme/Click payment). Only "payme" | "click" are valid.
export async function retryOrderPayment(
  number: string,
  paymentMethod: Extract<PaymentMethod, "payme" | "click">,
): Promise<{ paymentRedirectUrl: string }> {
  return apiFetch(`/orders/${number}/pay`, { method: "POST", body: { paymentMethod } });
}
