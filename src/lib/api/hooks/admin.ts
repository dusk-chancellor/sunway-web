"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminStats,
  fetchAdminProducts,
  fetchAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  fetchAdminOrders,
  fetchAdminOrder,
  changeAdminOrderStatus,
  settleAdminCod,
  fetchAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  type ProductUpsert,
  type CategoryUpsert,
  type BannerUpsert,
} from "@/lib/api/resources/admin";
import { useUI } from "@/stores/ui";

export function useAdminStats() {
  return useQuery({ queryKey: ["admin", "stats"], queryFn: fetchAdminStats });
}

export function useAdminProducts(q?: string) {
  return useQuery({ queryKey: ["admin", "products", q ?? ""], queryFn: () => fetchAdminProducts(q) });
}
export function useAdminProduct(id: string, enabled = true) {
  return useQuery({ queryKey: ["admin", "product", id], queryFn: () => fetchAdminProduct(id), enabled: enabled && Boolean(id) });
}
export function useSaveAdminProduct() {
  const qc = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ProductUpsert }) =>
      id ? updateAdminProduct(id, input) : createAdminProduct(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      pushToast("Product saved", "ok");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });
}
export function useDeleteAdminProduct() {
  const qc = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  return useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      pushToast("Product removed", "ok");
    },
  });
}

export function useAdminCategories() {
  return useQuery({ queryKey: ["admin", "categories"], queryFn: fetchAdminCategories });
}
export function useSaveAdminCategory() {
  const qc = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CategoryUpsert }) =>
      id ? updateAdminCategory(id, input) : createAdminCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      pushToast("Category saved", "ok");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });
}
export function useDeleteAdminCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useAdminOrders(status?: string, q?: string) {
  return useQuery({ queryKey: ["admin", "orders", status ?? "all", q ?? ""], queryFn: () => fetchAdminOrders(status, q) });
}
export function useAdminOrder(number: string) {
  return useQuery({ queryKey: ["admin", "order", number], queryFn: () => fetchAdminOrder(number), enabled: Boolean(number) });
}
export function useChangeOrderStatus() {
  const qc = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  return useMutation({
    mutationFn: ({ number, status, note }: { number: string; status: string; note: string }) =>
      changeAdminOrderStatus(number, status, note),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin", "order", v.number] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      pushToast("Status updated", "ok");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });
}
export function useSettleCod() {
  const qc = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  return useMutation({
    mutationFn: (number: string) => settleAdminCod(number),
    onSuccess: (_d, number) => {
      qc.invalidateQueries({ queryKey: ["admin", "order", number] });
      pushToast("Payment settled", "ok");
    },
  });
}

export function useAdminBanners() {
  return useQuery({ queryKey: ["admin", "banners"], queryFn: fetchAdminBanners });
}
export function useSaveAdminBanner() {
  const qc = useQueryClient();
  const pushToast = useUI((s) => s.pushToast);
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: BannerUpsert }) =>
      id ? updateAdminBanner(id, input) : createAdminBanner(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      pushToast("Banner saved", "ok");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });
}
export function useDeleteAdminBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "banners"] }),
  });
}
