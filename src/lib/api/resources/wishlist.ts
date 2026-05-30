import { apiFetch } from "../client";
import { productSchema, type Product } from "@/lib/validation/schemas";
import { z } from "zod";

export async function fetchWishlist(): Promise<Product[]> {
  const data = await apiFetch<{ items: unknown }>(`/wishlist`);
  return z.array(productSchema).parse(data.items);
}
export async function addWishlist(productId: string): Promise<void> {
  await apiFetch(`/wishlist/${productId}`, { method: "POST" });
}
export async function removeWishlist(productId: string): Promise<void> {
  await apiFetch(`/wishlist/${productId}`, { method: "DELETE" });
}
