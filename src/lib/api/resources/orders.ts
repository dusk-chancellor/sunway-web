import { apiFetch } from "../client";
import { orderSchema, orderListSchema, type Order, type OrderList, type PaymentMethod } from "@/lib/validation/schemas";

export interface PlaceOrderInput {
  shippingAddressId?: string; // omitted for pickup orders
  shippingMethodId: string;
  paymentMethod: PaymentMethod;
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
