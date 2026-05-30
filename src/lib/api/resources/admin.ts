import { apiFetch } from "../client";
import {
  productSchema,
  categorySchema,
  orderSchema,
  orderListSchema,
  bannerSchema,
  adminStatsSchema,
  type Product,
  type Category,
  type Order,
  type OrderList,
  type Banner,
  type AdminStats,
} from "@/lib/validation/schemas";
import { z } from "zod";

export async function fetchAdminStats(): Promise<AdminStats> {
  return adminStatsSchema.parse(await apiFetch(`/admin/stats`));
}

/* products */
export async function fetchAdminProducts(q?: string): Promise<Product[]> {
  const data = await apiFetch<{ items: unknown }>(`/admin/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  return z.array(productSchema).parse(data.items);
}
export async function fetchAdminProduct(id: string): Promise<Product> {
  return productSchema.parse(await apiFetch(`/admin/products/${id}`));
}
export interface ProductUpsert {
  name: string;
  description: string;
  priceMinor: string;
  stockQty: number;
  categoryId: string;
  isActive: boolean;
}
export async function createAdminProduct(input: ProductUpsert): Promise<Product> {
  return productSchema.parse(await apiFetch(`/admin/products`, { method: "POST", body: input }));
}
export async function updateAdminProduct(id: string, input: ProductUpsert): Promise<Product> {
  return productSchema.parse(await apiFetch(`/admin/products/${id}`, { method: "PATCH", body: input }));
}
export async function deleteAdminProduct(id: string): Promise<void> {
  await apiFetch(`/admin/products/${id}`, { method: "DELETE" });
}

/* categories */
export async function fetchAdminCategories(): Promise<Category[]> {
  const data = await apiFetch<{ items: unknown }>(`/admin/categories`);
  return z.array(categorySchema).parse(data.items);
}
export interface CategoryUpsert {
  name: string;
  featured: boolean;
  isActive: boolean;
}
export async function createAdminCategory(input: CategoryUpsert): Promise<Category> {
  return categorySchema.parse(await apiFetch(`/admin/categories`, { method: "POST", body: input }));
}
export async function updateAdminCategory(id: string, input: CategoryUpsert): Promise<Category> {
  return categorySchema.parse(await apiFetch(`/admin/categories/${id}`, { method: "PATCH", body: input }));
}
export async function deleteAdminCategory(id: string): Promise<void> {
  await apiFetch(`/admin/categories/${id}`, { method: "DELETE" });
}

/* orders */
export async function fetchAdminOrders(status?: string, q?: string): Promise<OrderList> {
  const p = new URLSearchParams();
  if (status) p.set("status", status);
  if (q) p.set("q", q);
  const s = p.toString();
  return orderListSchema.parse(await apiFetch(`/admin/orders${s ? `?${s}` : ""}`));
}
export async function fetchAdminOrder(number: string): Promise<Order> {
  return orderSchema.parse(await apiFetch(`/admin/orders/${number}`));
}
export async function changeAdminOrderStatus(number: string, status: string, note: string): Promise<Order> {
  return orderSchema.parse(await apiFetch(`/admin/orders/${number}/status`, { method: "POST", body: { status, note } }));
}
export async function settleAdminCod(number: string): Promise<Order> {
  return orderSchema.parse(await apiFetch(`/admin/orders/${number}/settle`, { method: "POST" }));
}

/* banners */
export async function fetchAdminBanners(): Promise<Banner[]> {
  const data = await apiFetch<{ items: unknown }>(`/admin/banners`);
  return z.array(bannerSchema).parse(data.items);
}
export interface BannerUpsert {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  active: boolean;
}
export async function createAdminBanner(input: BannerUpsert): Promise<Banner> {
  return bannerSchema.parse(await apiFetch(`/admin/banners`, { method: "POST", body: input }));
}
export async function updateAdminBanner(id: string, input: BannerUpsert): Promise<Banner> {
  return bannerSchema.parse(await apiFetch(`/admin/banners/${id}`, { method: "PATCH", body: input }));
}
export async function deleteAdminBanner(id: string): Promise<void> {
  await apiFetch(`/admin/banners/${id}`, { method: "DELETE" });
}
