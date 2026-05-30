import { z } from "zod";

/* ── Money ──────────────────────────────────────────────────────────────────
   Transmitted as a string (bigint-safe over JSON), parsed to bigint here. */
export const moneyMinor = z
  .union([z.string(), z.number()])
  .transform((v) => BigInt(typeof v === "number" ? Math.round(v) : v));

export const currency = z.literal("UZS");

/* ── Catalog ───────────────────────────────────────────────────────────── */
export const productImageSchema = z.object({
  id: z.string(),
  url: z.string().nullable(),
  alt: z.string(),
  isPrimary: z.boolean(),
  sortOrder: z.number(),
});

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  sku: z.string(),
  name: z.string(),
  description: z.string(),
  priceMinor: moneyMinor,
  currency,
  stockQty: z.number().int(),
  categoryId: z.string(),
  categorySlug: z.string(),
  categoryName: z.string(),
  images: z.array(productImageSchema),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type Product = z.infer<typeof productSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;

export const productListSchema = z.object({
  items: z.array(productSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});
export type ProductList = z.infer<typeof productListSchema>;

export const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  productCount: z.number().int(),
  featured: z.boolean(),
  sortOrder: z.number(),
  isActive: z.boolean(),
});
export type Category = z.infer<typeof categorySchema>;

export const bannerSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  ctaLabel: z.string(),
  ctaHref: z.string(),
  imageUrl: z.string().nullable(),
  sortOrder: z.number(),
  active: z.boolean(),
});
export type Banner = z.infer<typeof bannerSchema>;

export const pageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  html: z.string(),
  updatedAt: z.string(),
});
export type StaticPage = z.infer<typeof pageSchema>;

/* ── Cart ──────────────────────────────────────────────────────────────── */
export const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  unitPriceMinor: moneyMinor,
  quantity: z.number().int(),
  stockQty: z.number().int(),
  lineTotalMinor: moneyMinor,
});
export type CartItem = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  subtotalMinor: moneyMinor,
  currency,
  count: z.number().int(),
});
export type Cart = z.infer<typeof cartSchema>;

/* ── Auth / user ───────────────────────────────────────────────────────── */
export const userSchema = z.object({
  id: z.string(),
  phone: z.string(),
  fullName: z.string(),
  email: z.string().nullable(),
  dob: z.string().nullable(),
  role: z.enum(["customer", "sales_manager"]),
});
export type User = z.infer<typeof userSchema>;

export const otpRequestResultSchema = z.object({
  ok: z.literal(true),
  // dev-only convenience: the code the MockSMS provider "sent"
  devCode: z.string().optional(),
});

export const authResultSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});
export type AuthResult = z.infer<typeof authResultSchema>;

/* ── Addresses ─────────────────────────────────────────────────────────── */
export const addressSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  country: z.string(),
  region: z.string(),
  city: z.string(),
  street: z.string(),
  apartment: z.string().nullable(),
  postalCode: z.string().nullable(),
  isDefault: z.boolean(),
});
export type Address = z.infer<typeof addressSchema>;

/* ── Shipping ──────────────────────────────────────────────────────────── */
export const shippingMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  priceMinor: moneyMinor,
  sortOrder: z.number(),
});
export type ShippingMethod = z.infer<typeof shippingMethodSchema>;

/* ── Orders ────────────────────────────────────────────────────────────── */
export const orderStatus = z.enum([
  "pending",
  "confirmed",
  "in_delivery",
  "delivered",
  "cancelled",
]);
export type OrderStatus = z.infer<typeof orderStatus>;

export const paymentStatus = z.enum([
  "pending",
  "paid",
  "failed",
  "refunded",
  "cod_pending",
]);
export type PaymentStatus = z.infer<typeof paymentStatus>;

export const paymentMethod = z.enum(["card", "cod"]);
export type PaymentMethod = z.infer<typeof paymentMethod>;

export const orderItemSchema = z.object({
  id: z.string(),
  productName: z.string(),
  slug: z.string(),
  imageUrl: z.string().nullable(),
  unitPriceMinor: moneyMinor,
  quantity: z.number().int(),
  lineTotalMinor: moneyMinor,
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const orderTimelineNode = z.object({
  status: orderStatus,
  reachedAt: z.string().nullable(),
  note: z.string().nullable(),
});

export const orderSchema = z.object({
  id: z.string(),
  number: z.string(),
  status: orderStatus,
  paymentMethod,
  paymentStatus,
  items: z.array(orderItemSchema),
  subtotalMinor: moneyMinor,
  shippingMinor: moneyMinor,
  discountMinor: moneyMinor,
  totalMinor: moneyMinor,
  currency,
  shippingAddress: addressSchema,
  shippingMethodName: z.string(),
  createdAt: z.string(),
  estimatedDelivery: z.string().nullable(),
  paymentRedirectUrl: z.string().nullable(),
  timeline: z.array(orderTimelineNode),
});
export type Order = z.infer<typeof orderSchema>;

export const orderListSchema = z.object({
  items: z.array(orderSchema),
  counts: z.object({
    all: z.number().int(),
    active: z.number().int(),
    completed: z.number().int(),
    cancelled: z.number().int(),
  }),
});
export type OrderList = z.infer<typeof orderListSchema>;

/* ── Admin ─────────────────────────────────────────────────────────────── */
export const adminStatsSchema = z.object({
  ordersTodayByStatus: z.record(z.string(), z.number()),
  lowStock: z.array(
    z.object({ id: z.string(), name: z.string(), stockQty: z.number() }),
  ),
  revenueMtdMinor: moneyMinor,
  currency,
  smsFailures: z.array(
    z.object({ phone: z.string(), error: z.string(), at: z.string() }),
  ),
});
export type AdminStats = z.infer<typeof adminStatsSchema>;

/* ── Errors ────────────────────────────────────────────────────────────── */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    // optional structured detail (e.g. stock conflict line items)
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/* ── Form input schemas (shared client+server validation) ──────────────── */
export const phoneInput = z.string().min(6);

export const addressInput = z.object({
  fullName: z.string().min(2),
  country: z.string().min(2),
  region: z.string().min(1),
  city: z.string().min(1),
  street: z.string().min(1),
  apartment: z.string().optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressInput>;

export const profileInput = z.object({
  fullName: z.string().min(2),
  email: z.string().email().or(z.literal("")).optional(),
  dob: z.string().optional(),
});
export type ProfileInput = z.infer<typeof profileInput>;
