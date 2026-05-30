"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchProducts,
  fetchProduct,
  fetchCategories,
  fetchBanners,
  fetchRelated,
  fetchShippingMethods,
  fetchSearch,
  type ProductQuery,
} from "@/lib/api/resources/catalog";

export function useProducts(q: ProductQuery) {
  return useQuery({
    queryKey: ["products", q],
    queryFn: () => fetchProducts(q),
    placeholderData: keepPreviousData,
  });
}
export function useProduct(slug: string) {
  return useQuery({ queryKey: ["product", slug], queryFn: () => fetchProduct(slug), enabled: Boolean(slug) });
}
export function useRelated(productId: string) {
  return useQuery({ queryKey: ["related", productId], queryFn: () => fetchRelated(productId), enabled: Boolean(productId) });
}
export function useCategories(featured = false) {
  return useQuery({ queryKey: ["categories", featured], queryFn: () => fetchCategories(featured) });
}
export function useBanners() {
  return useQuery({ queryKey: ["banners"], queryFn: fetchBanners });
}
export function useShippingMethods() {
  return useQuery({ queryKey: ["shipping-methods"], queryFn: fetchShippingMethods });
}
export function useSearch(q: string, page = 1) {
  return useQuery({
    queryKey: ["search", q, page],
    queryFn: () => fetchSearch(q, page),
    enabled: q.trim().length > 0,
    placeholderData: keepPreviousData,
  });
}
