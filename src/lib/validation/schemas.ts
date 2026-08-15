import { z } from "zod";

/* ── Money ──────────────────────────────────────────────────────────────────
   Transmitted as a string (bigint-safe over JSON), parsed to bigint here. */
export const moneyMinor = z
  .union([z.string(), z.number()])
  .transform((v) => BigInt(typeof v === "number" ? Math.round(v) : v));

export const currency = z.enum(["UZS", "USD"]);

/* ── Translations ────────────────────────────────────────────────────────────
   Optional per-locale field overrides: locale -> field -> value. The base
   columns are the fallback; see localized() in lib/i18n/content.ts. */
export const translations = z
  .record(z.string(), z.record(z.string(), z.string()))
  .nullish()
  .transform((v) => v ?? {});
export type Translations = Record<string, Record<string, string>>;

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
  translations,
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
  translations,
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
  translations,
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

/* ── Shipping ────────────────────────────────────────────────────────────
   A delivery option carries no price: the fee is quoted and collected in cash
   by the courier, for every payment method, so it never enters an order total
   or a gateway charge. */
export const shippingMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  sortOrder: z.number(),
  translations,
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

// Online gateways redirect to the provider's hosted page; cod is settled on
// delivery. The backend returns paymentRedirectUrl for the online methods,
// which the checkout follows.
//
// uzum_nasiya is installments: the customer signs a credit contract with Uzum,
// Uzum pays us, and the customer repays them monthly. It redirects like the
// others, but the order only becomes paid once the backend has confirmed the
// contract — returning from the WebView proves nothing.
export const paymentMethod = z.enum(["payme", "click", "uzum_nasiya", "cod"]);
export type PaymentMethod = z.infer<typeof paymentMethod>;

// Online methods, in the order the checkout offers them.
export const onlinePaymentMethods = ["payme", "click", "uzum_nasiya"] as const;
export type OnlinePaymentMethod = (typeof onlinePaymentMethods)[number];
export function isOnlineMethod(m: PaymentMethod): m is OnlinePaymentMethod {
  return m !== "cod";
}

/* ── Installments (Uzum Nasiya) ──────────────────────────────────────────── */

// What the customer may do next. "ready" is the only state with prices behind
// it; "registration" opens Uzum's own WebView; "blocked" is a hard stop.
export const nasiyaState = z.enum(["ready", "registration", "blocked"]);
export type NasiyaState = z.infer<typeof nasiyaState>;

// statusCode is Uzum's raw user status. It travels with the state so the UI can
// name the exact missing document (5 = passport photo, 10 = selfie with
// passport, 11 = residence page, 12 = contact person) instead of a generic
// "finish registration".
export const nasiyaBuyerSchema = z.object({
  state: nasiyaState,
  statusCode: z.number().int(),
  webviewUrl: z.string(),
  hasLimit: z.boolean(),
  hasOverdueContracts: z.boolean(),
  balanceMinor: moneyMinor,
  periods: z.array(
    z.object({
      tariff: z.string(),
      titleRu: z.string(),
      titleUz: z.string(),
      markupPercent: z.number().int(),
    }),
  ),
});
export type NasiyaBuyer = z.infer<typeof nasiyaBuyerSchema>;

// One priced plan for the current cart. originMinor is what we receive;
// totalMinor is what the customer repays in all.
export const nasiyaTariffSchema = z.object({
  tariff: z.string(),
  periodMonths: z.number().int(),
  titleRu: z.string(),
  titleUz: z.string(),
  monthlyMinor: moneyMinor,
  totalMinor: moneyMinor,
  originMinor: moneyMinor,
  depositMinor: moneyMinor,
  markupPercent: z.number().int(),
  isAvailable: z.boolean(),
  statusCode: z.number().int(),
  errorMessage: z.string(),
});
export type NasiyaTariff = z.infer<typeof nasiyaTariffSchema>;

export const nasiyaQuoteSchema = z.object({
  buyer: nasiyaBuyerSchema,
  tariffs: z.array(nasiyaTariffSchema),
});
export type NasiyaQuote = z.infer<typeof nasiyaQuoteSchema>;

// The contract attached to an order. isSigned means the customer signed in the
// WebView — NOT that the order is paid; paymentStatus is the authority there.
export const nasiyaContractSchema = z.object({
  state: z.string(),
  tariff: z.string(),
  periodMonths: z.number().int(),
  monthlyMinor: moneyMinor.nullable(),
  totalMinor: moneyMinor.nullable(),
  originMinor: moneyMinor,
  markupPercent: z.number().int().nullable(),
  contractId: z.number().nullable(),
  providerRef: z.number().nullable(),
  contractStatus: z.number().int().nullable(),
  isSigned: z.boolean(),
  customerName: z.string(),
  actPdf: z.string().nullable(),
  signingUrl: z.string().nullable(),
});
export type NasiyaContract = z.infer<typeof nasiyaContractSchema>;

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
  phone: z.string().optional().default(""),
  customerName: z.string().optional().default(""),
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
  nasiya: nasiyaContractSchema.nullish(),
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
  // Paid revenue this month, kept separate per currency (UZS/USD never summed).
  revenueMtdByCurrency: z.record(z.string(), moneyMinor).nullish().transform((v) => v ?? {}),
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
});
export type ProfileInput = z.infer<typeof profileInput>;
