import { apiFetch } from "../client";
import { cartSchema, type Cart } from "@/lib/validation/schemas";

export async function fetchCart(): Promise<Cart> {
  return cartSchema.parse(await apiFetch(`/cart`));
}
export async function addCartItem(productId: string, quantity = 1): Promise<Cart> {
  return cartSchema.parse(await apiFetch(`/cart/items`, { method: "POST", body: { productId, quantity } }));
}
export async function patchCartItem(id: string, quantity: number): Promise<Cart> {
  return cartSchema.parse(await apiFetch(`/cart/items/${id}`, { method: "PATCH", body: { quantity } }));
}
export async function deleteCartItem(id: string): Promise<Cart> {
  return cartSchema.parse(await apiFetch(`/cart/items/${id}`, { method: "DELETE" }));
}
export async function mergeCart(): Promise<Cart> {
  return cartSchema.parse(await apiFetch(`/cart/merge`, { method: "POST" }));
}
