import { apiFetch } from "../client";
import {
  productSchema,
  productListSchema,
  categorySchema,
  bannerSchema,
  pageSchema,
  shippingMethodSchema,
  type Product,
  type ProductList,
  type Category,
  type Banner,
  type StaticPage,
  type ShippingMethod,
} from "@/lib/validation/schemas";
import { z } from "zod";

export interface ProductQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  featured?: boolean;
  page?: number;
}

function qs(q: ProductQuery): string {
  const p = new URLSearchParams();
  if (q.category) p.set("category", q.category);
  if (q.minPrice != null) p.set("min_price", String(q.minPrice));
  if (q.maxPrice != null) p.set("max_price", String(q.maxPrice));
  if (q.sort) p.set("sort", q.sort);
  if (q.featured) p.set("featured", "true");
  if (q.page) p.set("page", String(q.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function fetchProducts(q: ProductQuery = {}): Promise<ProductList> {
  return productListSchema.parse(await apiFetch(`/products${qs(q)}`));
}
export async function fetchProduct(slug: string): Promise<Product> {
  return productSchema.parse(await apiFetch(`/products/${slug}`));
}
export async function fetchRelated(productId: string): Promise<Product[]> {
  const data = await apiFetch<{ items: unknown }>(`/products?related_to=${productId}`);
  return z.array(productSchema).parse(data.items);
}
export async function fetchCategories(featured = false): Promise<Category[]> {
  const data = await apiFetch<{ items: unknown }>(`/categories${featured ? "?featured=true" : ""}`);
  return z.array(categorySchema).parse(data.items);
}
export async function fetchBanners(): Promise<Banner[]> {
  const data = await apiFetch<{ items: unknown }>(`/banners`);
  return z.array(bannerSchema).parse(data.items);
}
export async function fetchPage(slug: string, locale?: string): Promise<StaticPage> {
  const q = locale ? `?locale=${encodeURIComponent(locale)}` : "";
  return pageSchema.parse(await apiFetch(`/pages/${slug}${q}`));
}
export async function fetchShippingMethods(): Promise<ShippingMethod[]> {
  const data = await apiFetch<{ items: unknown }>(`/shipping-methods`);
  return z.array(shippingMethodSchema).parse(data.items);
}
export async function fetchSearch(q: string, page = 1): Promise<ProductList> {
  return productListSchema.parse(await apiFetch(`/search?q=${encodeURIComponent(q)}&page=${page}`));
}
