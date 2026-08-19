"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCart, addCartItem, patchCartItem, deleteCartItem } from "@/lib/api/resources/cart";
import type { Cart } from "@/lib/validation/schemas";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUI } from "@/stores/ui";

const CART_KEY = ["cart"] as const;

// Waits for the auth bootstrap before fetching. The access token lives in
// memory only, so on a cold page load it is empty until /auth/refresh returns.
// GET /cart without it is a valid *guest* request — the API answers 200 with an
// empty cart rather than 401, so there is no failure for the client to retry —
// and that empty cart would be cached as the signed-in customer's own.
// isLoading follows isPending so the disabled window still reads as loading
// instead of briefly rendering an empty cart.
export function useCart() {
  const { isReady } = useAuth();
  const query = useQuery({
    queryKey: CART_KEY,
    queryFn: fetchCart,
    staleTime: 30_000,
    enabled: isReady,
  });
  return { ...query, isLoading: query.isPending };
}

export function useAddToCart() {
  const qc = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) =>
      addCartItem(productId, quantity ?? 1),
    onSuccess: (cart) => {
      qc.setQueryData(CART_KEY, cart);
      pushToast("Added to cart", "ok");
    },
    onError: (err: Error) => pushToast(err.message || "Could not add to cart", "bad"),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => patchCartItem(id, quantity),
    onMutate: async ({ id, quantity }) => {
      await qc.cancelQueries({ queryKey: CART_KEY });
      const prev = qc.getQueryData<Cart>(CART_KEY);
      if (prev) {
        const items = prev.items.map((it) =>
          it.id === id ? { ...it, quantity, lineTotalMinor: it.unitPriceMinor * BigInt(quantity) } : it,
        );
        const subtotalMinor = items.reduce((acc, it) => acc + it.lineTotalMinor, 0n);
        const count = items.reduce((acc, it) => acc + it.quantity, 0);
        qc.setQueryData<Cart>(CART_KEY, { ...prev, items, subtotalMinor, count });
      }
      return { prev };
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(CART_KEY, ctx.prev);
      pushToast(err.message || "Could not update cart", "bad");
    },
    onSuccess: (cart) => qc.setQueryData(CART_KEY, cart),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  return useMutation({
    mutationFn: (id: string) => deleteCartItem(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: CART_KEY });
      const prev = qc.getQueryData<Cart>(CART_KEY);
      if (prev) {
        const items = prev.items.filter((it) => it.id !== id);
        const subtotalMinor = items.reduce((acc, it) => acc + it.lineTotalMinor, 0n);
        const count = items.reduce((acc, it) => acc + it.quantity, 0);
        qc.setQueryData<Cart>(CART_KEY, { ...prev, items, subtotalMinor, count });
      }
      return { prev };
    },
    onError: (err: Error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(CART_KEY, ctx.prev);
      pushToast(err.message || "Could not remove item", "bad");
    },
    onSuccess: (cart) => qc.setQueryData(CART_KEY, cart),
  });
}
