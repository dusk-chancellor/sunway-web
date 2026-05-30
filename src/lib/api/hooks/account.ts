"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  updateProfile,
} from "@/lib/api/resources/me";
import { fetchOrders, fetchOrder, cancelOrder } from "@/lib/api/resources/orders";
import { fetchWishlist, addWishlist, removeWishlist } from "@/lib/api/resources/wishlist";
import type { AddressInput, ProfileInput } from "@/lib/validation/schemas";
import { useUI } from "@/stores/ui";

export function useAddresses(enabled = true) {
  return useQuery({ queryKey: ["addresses"], queryFn: fetchAddresses, enabled });
}
export function useSaveAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: AddressInput }) =>
      id ? updateAddress(id, input) : createAddress(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}
export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}
export function useUpdateProfile() {
  const qc = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  return useMutation({
    mutationFn: (input: ProfileInput) => updateProfile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      pushToast("Saved", "ok");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });
}

export function useOrders(enabled = true) {
  return useQuery({ queryKey: ["orders"], queryFn: fetchOrders, enabled });
}
export function useOrder(number: string) {
  return useQuery({ queryKey: ["order", number], queryFn: () => fetchOrder(number), enabled: Boolean(number) });
}
export function useCancelOrder() {
  const qc = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  return useMutation({
    mutationFn: (number: string) => cancelOrder(number),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order"] });
      pushToast("Order cancelled", "ok");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });
}

export function useWishlist(enabled = true) {
  return useQuery({ queryKey: ["wishlist"], queryFn: fetchWishlist, enabled });
}
export function useToggleWishlist() {
  const qc = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  return useMutation({
    mutationFn: ({ productId, on }: { productId: string; on: boolean }) =>
      on ? addWishlist(productId) : removeWishlist(productId),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      pushToast(vars.on ? "Saved to wishlist" : "Removed from wishlist", "ok");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });
}
