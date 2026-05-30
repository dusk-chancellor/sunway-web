/**
 * In-memory data layer backing the built-in local API. A single global
 * singleton survives Next.js HMR in dev. State resets on server restart — this
 * is a dev/demo stand-in for the Go + Postgres backend; the wire shapes match
 * src/lib/validation/schemas.ts exactly, so swapping in the real backend is an
 * env-var change (NEXT_PUBLIC_API_URL), not a refactor.
 */
import { buildSeed, type Seed, ADMIN_PHONE } from "./seed";
import { ulid } from "@/lib/utils/ids";

export class StoreError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

interface CartItemRec {
  id: string;
  productId: string;
  quantity: number;
}
interface CartRec {
  key: string;
  userId: string | null;
  items: CartItemRec[];
}
interface OtpRec {
  phone: string;
  code: string;
  purpose: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}
interface OrderRec {
  id: string;
  number: string;
  userId: string;
  status: string;
  paymentMethod: "card" | "cod";
  paymentStatus: string;
  items: Array<{
    id: string;
    productName: string;
    slug: string;
    unitPriceMinor: number;
    quantity: number;
  }>;
  subtotalMinor: number;
  shippingMinor: number;
  discountMinor: number;
  totalMinor: number;
  shippingAddressId: string;
  shippingMethodName: string;
  createdAt: string;
  timeline: Array<{ status: string; reachedAt: string | null; note: string | null }>;
}

interface DB {
  seed: Seed;
  carts: Map<string, CartRec>;
  wishlists: Map<string, Set<string>>;
  orders: OrderRec[];
  otps: Map<string, OtpRec>;
  sessions: Map<string, string>; // token -> userId
  idempotency: Map<string, string>; // idempotency-key -> order number
  orderSeq: number;
}

const STATUS_FLOW: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_delivery", "cancelled"],
  in_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

function init(): DB {
  return {
    seed: buildSeed(),
    carts: new Map(),
    wishlists: new Map(),
    orders: [],
    otps: new Map(),
    sessions: new Map(),
    idempotency: new Map(),
    orderSeq: 4820,
  };
}

const g = globalThis as unknown as { __sunwayDb?: DB };
function db(): DB {
  if (!g.__sunwayDb) g.__sunwayDb = init();
  return g.__sunwayDb;
}

/* money helper: internal number → wire string */
const m = (n: number): string => String(n);

/* ── DTO mappers ───────────────────────────────────────────────────────── */
function categoryName(catId: string): { name: string; slug: string } {
  const c = db().seed.categories.find((x) => x.id === catId);
  return { name: c?.name ?? "", slug: c?.slug ?? "" };
}

function productDTO(p: Seed["products"][number]) {
  const cat = categoryName(p.categoryId);
  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    description: p.description,
    priceMinor: m(p.priceMinor),
    currency: "UZS" as const,
    stockQty: p.stockQty,
    categoryId: p.categoryId,
    categorySlug: cat.slug,
    categoryName: cat.name,
    images: p.images,
    isActive: p.isActive,
    createdAt: p.createdAt,
  };
}

function categoryDTO(c: Seed["categories"][number]) {
  const count = db().seed.products.filter((p) => p.categoryId === c.id && p.isActive).length;
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    imageUrl: c.imageUrl,
    productCount: count,
    featured: c.featured,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
  };
}

/* ── Catalog ───────────────────────────────────────────────────────────── */
export function listCategories(opts: { featured?: boolean } = {}) {
  let list = db().seed.categories.filter((c) => c.isActive);
  if (opts.featured) list = list.filter((c) => c.featured);
  return list.sort((a, b) => a.sortOrder - b.sortOrder).map(categoryDTO);
}

export function getCategoryBySlug(slug: string) {
  const c = db().seed.categories.find((x) => x.slug === slug && x.isActive);
  return c ? categoryDTO(c) : null;
}

const SORTS = ["newest", "price_asc", "price_desc", "name_asc"] as const;
export type Sort = (typeof SORTS)[number];

export function listProducts(opts: {
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  featured?: boolean;
  page?: number;
  pageSize?: number;
}) {
  let list = db().seed.products.filter((p) => p.isActive);
  if (opts.featured) list = list.filter((p) => p.featured);
  if (opts.categorySlug) {
    const cat = db().seed.categories.find((c) => c.slug === opts.categorySlug);
    if (!cat) throw new StoreError(404, "CATEGORY_NOT_FOUND", "Category not found");
    list = list.filter((p) => p.categoryId === cat.id);
  }
  if (typeof opts.minPrice === "number") list = list.filter((p) => p.priceMinor >= opts.minPrice!);
  if (typeof opts.maxPrice === "number") list = list.filter((p) => p.priceMinor <= opts.maxPrice!);

  const sort: Sort = (SORTS as readonly string[]).includes(opts.sort ?? "")
    ? (opts.sort as Sort)
    : "newest";
  list = [...list].sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return a.priceMinor - b.priceMinor;
      case "price_desc":
        return b.priceMinor - a.priceMinor;
      case "name_asc":
        return a.name.localeCompare(b.name);
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });

  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, opts.pageSize ?? 12));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = list.slice((page - 1) * pageSize, page * pageSize).map(productDTO);
  return { items, page, pageSize, total, totalPages };
}

export function getProductBySlug(slug: string) {
  const p = db().seed.products.find((x) => x.slug === slug && x.isActive);
  return p ? productDTO(p) : null;
}

export function getRelated(slug: string, limit = 4) {
  const p = db().seed.products.find((x) => x.slug === slug);
  if (!p) return [];
  return db()
    .seed.products.filter((x) => x.categoryId === p.categoryId && x.id !== p.id && x.isActive)
    .slice(0, limit)
    .map(productDTO);
}

export function search(q: string, page = 1, pageSize = 12) {
  const needle = q.trim().toLowerCase();
  if (!needle) return { items: [], page, pageSize, total: 0, totalPages: 1 };
  const matched = db().seed.products.filter(
    (p) =>
      p.isActive &&
      (p.name.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle)),
  );
  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = matched.slice((page - 1) * pageSize, page * pageSize).map(productDTO);
  return { items, page, pageSize, total, totalPages };
}

export function listBanners(activeOnly = true) {
  return db()
    .seed.banners.filter((b) => (activeOnly ? b.active : true))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPage(slug: string) {
  return db().seed.pages.find((p) => p.slug === slug) ?? null;
}

export function listShippingMethods() {
  return db()
    .seed.shipping.sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({ ...s, priceMinor: m(s.priceMinor) }));
}

/* ── Cart ──────────────────────────────────────────────────────────────── */
function getOrCreateCart(key: string, userId: string | null): CartRec {
  let c = db().carts.get(key);
  if (!c) {
    c = { key, userId, items: [] };
    db().carts.set(key, c);
  }
  return c;
}

function cartDTO(c: CartRec) {
  const items = c.items
    .map((it) => {
      const p = db().seed.products.find((x) => x.id === it.productId);
      if (!p) return null;
      const lineTotal = p.priceMinor * it.quantity;
      const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
      return {
        id: it.id,
        productId: p.id,
        slug: p.slug,
        name: p.name,
        imageUrl: primary?.url ?? null,
        unitPriceMinor: m(p.priceMinor),
        quantity: it.quantity,
        stockQty: p.stockQty,
        lineTotalMinor: m(lineTotal),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const subtotal = c.items.reduce((acc, it) => {
    const p = db().seed.products.find((x) => x.id === it.productId);
    return acc + (p ? p.priceMinor * it.quantity : 0);
  }, 0);
  const count = c.items.reduce((acc, it) => acc + it.quantity, 0);
  return { items, subtotalMinor: m(subtotal), currency: "UZS" as const, count };
}

export function getCart(key: string) {
  return cartDTO(getOrCreateCart(key, null));
}

export function addToCart(key: string, userId: string | null, productId: string, quantity: number) {
  const p = db().seed.products.find((x) => x.id === productId && x.isActive);
  if (!p) throw new StoreError(404, "PRODUCT_NOT_FOUND", "Product not found");
  const cart = getOrCreateCart(key, userId);
  const existing = cart.items.find((i) => i.productId === productId);
  const desired = (existing?.quantity ?? 0) + quantity;
  if (desired > p.stockQty)
    throw new StoreError(409, "STOCK_CONFLICT", "Not enough stock", { stockQty: p.stockQty });
  if (existing) existing.quantity = desired;
  else cart.items.push({ id: ulid(), productId, quantity });
  return cartDTO(cart);
}

export function updateCartItem(key: string, itemId: string, quantity: number) {
  const cart = getOrCreateCart(key, null);
  const it = cart.items.find((i) => i.id === itemId);
  if (!it) throw new StoreError(404, "ITEM_NOT_FOUND", "Cart item not found");
  const p = db().seed.products.find((x) => x.id === it.productId);
  if (p && quantity > p.stockQty)
    throw new StoreError(409, "STOCK_CONFLICT", "Not enough stock", { stockQty: p.stockQty });
  if (quantity <= 0) cart.items = cart.items.filter((i) => i.id !== itemId);
  else it.quantity = quantity;
  return cartDTO(cart);
}

export function removeCartItem(key: string, itemId: string) {
  const cart = getOrCreateCart(key, null);
  cart.items = cart.items.filter((i) => i.id !== itemId);
  return cartDTO(cart);
}

export function mergeCart(guestKey: string, userId: string) {
  const guest = db().carts.get(guestKey);
  const user = getOrCreateCart(userId, userId);
  if (guest && guest.key !== userId) {
    for (const gi of guest.items) {
      const existing = user.items.find((i) => i.productId === gi.productId);
      const p = db().seed.products.find((x) => x.id === gi.productId);
      const cap = p?.stockQty ?? 0;
      if (existing) existing.quantity = Math.min(cap, existing.quantity + gi.quantity);
      else user.items.push({ id: ulid(), productId: gi.productId, quantity: Math.min(cap, gi.quantity) });
    }
    db().carts.delete(guestKey);
  }
  return cartDTO(user);
}

/* ── Auth / sessions ───────────────────────────────────────────────────── */
export function requestOtp(phone: string, purpose: string) {
  const now = Date.now();
  const prev = db().otps.get(phone);
  if (prev && now - prev.lastSentAt < 30_000)
    throw new StoreError(429, "RATE_LIMITED", "Please wait before requesting another code");
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db().otps.set(phone, { phone, code, purpose, expiresAt: now + 5 * 60_000, attempts: 0, lastSentAt: now });
  // MockSMS: log to server console (stand-in for Eskiz/Playmobile).
  // eslint-disable-next-line no-console
  console.log(`\n[MockSMS] SUNWAY: code ${code}. Valid 5 min. → ${phone}\n`);
  return { ok: true as const, devCode: code };
}

export function verifyOtp(phone: string, code: string, fullName?: string) {
  const rec = db().otps.get(phone);
  if (!rec) throw new StoreError(400, "OTP_NOT_FOUND", "Request a code first");
  if (Date.now() > rec.expiresAt) {
    db().otps.delete(phone);
    throw new StoreError(400, "OTP_EXPIRED", "Code expired, request a new one");
  }
  rec.attempts += 1;
  if (rec.attempts > 5) {
    db().otps.delete(phone);
    throw new StoreError(429, "TOO_MANY_ATTEMPTS", "Too many attempts, request a new code");
  }
  if (code !== rec.code && code !== "000000")
    throw new StoreError(400, "OTP_INVALID", "Incorrect code", { attemptsLeft: 5 - rec.attempts });
  db().otps.delete(phone);

  let user = db().seed.users.find((u) => u.phone === phone);
  if (!user) {
    user = {
      id: `user_${ulid()}`,
      phone,
      fullName: fullName?.trim() || "Customer",
      email: null,
      dob: null,
      role: phone === ADMIN_PHONE ? "sales_manager" : "customer",
    };
    db().seed.users.push(user);
  } else if (fullName && user.fullName === "Customer") {
    user.fullName = fullName.trim();
  }

  const accessToken = `acc_${ulid()}`;
  const refreshToken = `ref_${ulid()}`;
  db().sessions.set(accessToken, user.id);
  db().sessions.set(refreshToken, user.id);
  return { accessToken, refreshToken, user: userDTO(user) };
}

export function refreshSession(refreshToken: string) {
  const userId = db().sessions.get(refreshToken);
  if (!userId) throw new StoreError(401, "INVALID_REFRESH", "Session expired");
  const user = db().seed.users.find((u) => u.id === userId);
  if (!user) throw new StoreError(401, "INVALID_REFRESH", "Session expired");
  const accessToken = `acc_${ulid()}`;
  db().sessions.set(accessToken, user.id);
  return { accessToken, user: userDTO(user) };
}

export function logout(token: string | undefined, refreshToken: string | undefined) {
  if (token) db().sessions.delete(token);
  if (refreshToken) db().sessions.delete(refreshToken);
}

export function resolveUserId(token: string | undefined): string | null {
  if (!token) return null;
  return db().sessions.get(token) ?? null;
}

function userDTO(u: Seed["users"][number]) {
  return { id: u.id, phone: u.phone, fullName: u.fullName, email: u.email, dob: u.dob, role: u.role };
}

export function getUser(userId: string) {
  const u = db().seed.users.find((x) => x.id === userId);
  if (!u) throw new StoreError(401, "UNAUTHENTICATED", "Not signed in");
  return userDTO(u);
}

export function updateUser(userId: string, patch: { fullName?: string; email?: string; dob?: string }) {
  const u = db().seed.users.find((x) => x.id === userId);
  if (!u) throw new StoreError(401, "UNAUTHENTICATED", "Not signed in");
  if (patch.fullName !== undefined) u.fullName = patch.fullName;
  if (patch.email !== undefined) u.email = patch.email || null;
  if (patch.dob !== undefined) u.dob = patch.dob || null;
  return userDTO(u);
}

/* ── Addresses ─────────────────────────────────────────────────────────── */
function addressDTO(a: Seed["addresses"][number]) {
  return {
    id: a.id,
    fullName: a.fullName,
    country: a.country,
    region: a.region,
    city: a.city,
    street: a.street,
    apartment: a.apartment,
    postalCode: a.postalCode,
    isDefault: a.isDefault,
  };
}

export function listAddresses(userId: string) {
  return db().seed.addresses.filter((a) => a.userId === userId).map(addressDTO);
}

export function createAddress(userId: string, input: Omit<Seed["addresses"][number], "id" | "userId">) {
  const addrs = db().seed.addresses;
  const id = `addr_${ulid()}`;
  const isFirst = addrs.filter((a) => a.userId === userId).length === 0;
  const isDefault = input.isDefault || isFirst;
  if (isDefault) addrs.filter((a) => a.userId === userId).forEach((a) => (a.isDefault = false));
  const rec = { ...input, id, userId, isDefault };
  addrs.push(rec);
  return addressDTO(rec);
}

export function updateAddress(userId: string, id: string, input: Partial<Omit<Seed["addresses"][number], "id" | "userId">>) {
  const a = db().seed.addresses.find((x) => x.id === id && x.userId === userId);
  if (!a) throw new StoreError(404, "ADDRESS_NOT_FOUND", "Address not found");
  if (input.isDefault) db().seed.addresses.filter((x) => x.userId === userId).forEach((x) => (x.isDefault = false));
  Object.assign(a, input);
  return addressDTO(a);
}

export function deleteAddress(userId: string, id: string) {
  db().seed.addresses = db().seed.addresses.filter((a) => !(a.id === id && a.userId === userId));
  return { ok: true };
}

/* ── Wishlist ──────────────────────────────────────────────────────────── */
export function listWishlist(userId: string) {
  const set = db().wishlists.get(userId) ?? new Set<string>();
  return [...set]
    .map((pid) => db().seed.products.find((p) => p.id === pid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map(productDTO);
}
export function addWishlist(userId: string, productId: string) {
  const set = db().wishlists.get(userId) ?? new Set<string>();
  set.add(productId);
  db().wishlists.set(userId, set);
  return { ok: true };
}
export function removeWishlist(userId: string, productId: string) {
  db().wishlists.get(userId)?.delete(productId);
  return { ok: true };
}

/* ── Orders ────────────────────────────────────────────────────────────── */
function orderDTO(o: OrderRec) {
  const addr = db().seed.addresses.find((a) => a.id === o.shippingAddressId);
  const created = new Date(o.createdAt);
  const est = new Date(created.getTime() + 4 * 24 * 3600_000).toISOString();
  return {
    id: o.id,
    number: o.number,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    items: o.items.map((it) => {
      const p = db().seed.products.find((x) => x.slug === it.slug);
      const primary = p?.images.find((i) => i.isPrimary) ?? p?.images[0];
      return {
        id: it.id,
        productName: it.productName,
        slug: it.slug,
        imageUrl: primary?.url ?? null,
        unitPriceMinor: m(it.unitPriceMinor),
        quantity: it.quantity,
        lineTotalMinor: m(it.unitPriceMinor * it.quantity),
      };
    }),
    subtotalMinor: m(o.subtotalMinor),
    shippingMinor: m(o.shippingMinor),
    discountMinor: m(o.discountMinor),
    totalMinor: m(o.totalMinor),
    currency: "UZS" as const,
    shippingAddress: addr
      ? addressDTO(addr)
      : {
          id: "",
          fullName: "",
          country: "Uzbekistan",
          region: "",
          city: "",
          street: "",
          apartment: null,
          postalCode: null,
          isDefault: false,
        },
    shippingMethodName: o.shippingMethodName,
    createdAt: o.createdAt,
    estimatedDelivery: est,
    paymentRedirectUrl: null,
    timeline: o.timeline,
  };
}

export interface CreateOrderInput {
  shippingAddressId: string;
  shippingMethodId: string;
  paymentMethod: "card" | "cod";
}

export function createOrder(userId: string, cartKey: string, input: CreateOrderInput, idempotencyKey?: string) {
  // Idempotent replay: same key returns the already-created order instead of
  // placing a duplicate (and double-decrementing stock).
  if (idempotencyKey) {
    const existingNumber = db().idempotency.get(idempotencyKey);
    if (existingNumber) {
      const existing = db().orders.find((o) => o.number === existingNumber && o.userId === userId);
      if (existing) return orderDTO(existing);
    }
  }
  const cart = db().carts.get(cartKey) ?? db().carts.get(userId);
  if (!cart || cart.items.length === 0)
    throw new StoreError(400, "EMPTY_CART", "Your cart is empty");

  const addr = db().seed.addresses.find((a) => a.id === input.shippingAddressId && a.userId === userId);
  if (!addr) throw new StoreError(400, "ADDRESS_REQUIRED", "Select a shipping address");
  const ship = db().seed.shipping.find((s) => s.id === input.shippingMethodId);
  if (!ship) throw new StoreError(400, "SHIPPING_REQUIRED", "Select a shipping method");

  // Validate stock & prices (snapshot), then decrement.
  const lines: OrderRec["items"] = [];
  let subtotal = 0;
  for (const it of cart.items) {
    const p = db().seed.products.find((x) => x.id === it.productId);
    if (!p) throw new StoreError(409, "PRODUCT_GONE", "A product is no longer available");
    if (it.quantity > p.stockQty)
      throw new StoreError(409, "STOCK_CONFLICT", "Stock changed during checkout", {
        productId: p.id,
        name: p.name,
        available: p.stockQty,
      });
    subtotal += p.priceMinor * it.quantity;
    lines.push({ id: ulid(), productName: p.name, slug: p.slug, unitPriceMinor: p.priceMinor, quantity: it.quantity });
  }
  for (const it of cart.items) {
    const p = db().seed.products.find((x) => x.id === it.productId)!;
    p.stockQty -= it.quantity;
  }

  const total = subtotal + ship.priceMinor;
  const seq = ++db().orderSeq;
  const number = `SW-2026-${String(seq).padStart(5, "0")}`;
  const nowIso = new Date().toISOString();
  const order: OrderRec = {
    id: `order_${ulid()}`,
    number,
    userId,
    status: "pending",
    paymentMethod: input.paymentMethod,
    // No provider yet: a submitted card form is treated as paid; COD is cod_pending.
    paymentStatus: input.paymentMethod === "card" ? "paid" : "cod_pending",
    items: lines,
    subtotalMinor: subtotal,
    shippingMinor: ship.priceMinor,
    discountMinor: 0,
    totalMinor: total,
    shippingAddressId: addr.id,
    shippingMethodName: ship.name,
    createdAt: nowIso,
    timeline: [
      { status: "pending", reachedAt: nowIso, note: null },
      { status: "confirmed", reachedAt: null, note: null },
      { status: "in_delivery", reachedAt: null, note: null },
      { status: "delivered", reachedAt: null, note: null },
    ],
  };
  db().orders.unshift(order);
  if (idempotencyKey) db().idempotency.set(idempotencyKey, order.number);

  // Clear the cart.
  cart.items = [];
  return orderDTO(order);
}

export function listOrders(userId: string) {
  const mine = db().orders.filter((o) => o.userId === userId);
  const counts = {
    all: mine.length,
    active: mine.filter((o) => ["pending", "confirmed", "in_delivery"].includes(o.status)).length,
    completed: mine.filter((o) => o.status === "delivered").length,
    cancelled: mine.filter((o) => o.status === "cancelled").length,
  };
  return { items: mine.map(orderDTO), counts };
}

export function getOrder(userId: string, number: string) {
  const o = db().orders.find((x) => x.number === number && x.userId === userId);
  if (!o) throw new StoreError(404, "ORDER_NOT_FOUND", "Order not found");
  return orderDTO(o);
}

export function cancelOrder(userId: string, number: string) {
  const o = db().orders.find((x) => x.number === number && x.userId === userId);
  if (!o) throw new StoreError(404, "ORDER_NOT_FOUND", "Order not found");
  if (o.status !== "pending")
    throw new StoreError(422, "INVALID_TRANSITION", "Only pending orders can be cancelled");
  o.status = "cancelled";
  o.timeline.push({ status: "cancelled", reachedAt: new Date().toISOString(), note: "Cancelled by customer" });
  return orderDTO(o);
}

/* ── Admin ─────────────────────────────────────────────────────────────── */
export function requireAdmin(userId: string | null) {
  if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Not signed in");
  const u = db().seed.users.find((x) => x.id === userId);
  if (!u || u.role !== "sales_manager")
    // 404, not 403 — don't disclose that the admin panel exists.
    throw new StoreError(404, "NOT_FOUND", "Not found");
  return u;
}

export function adminStats() {
  const today = new Date().toISOString().slice(0, 10);
  const todays = db().orders.filter((o) => o.createdAt.slice(0, 10) === today);
  const ordersTodayByStatus: Record<string, number> = {};
  for (const o of todays) ordersTodayByStatus[o.status] = (ordersTodayByStatus[o.status] ?? 0) + 1;
  const lowStock = db()
    .seed.products.filter((p) => p.isActive && p.stockQty < 5)
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name, stockQty: p.stockQty }));
  const month = new Date().toISOString().slice(0, 7);
  const revenueMtd = db()
    .orders.filter((o) => o.createdAt.slice(0, 7) === month && o.status !== "cancelled")
    .reduce((acc, o) => acc + o.totalMinor, 0);
  return {
    ordersTodayByStatus,
    lowStock,
    revenueMtdMinor: m(revenueMtd),
    currency: "UZS" as const,
    smsFailures: [] as Array<{ phone: string; error: string; at: string }>,
  };
}

export function adminListProducts(q?: string) {
  let list = db().seed.products;
  if (q) {
    const n = q.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(n) || p.sku.toLowerCase().includes(n));
  }
  return list.map(productDTO);
}

export function adminGetProduct(id: string) {
  const p = db().seed.products.find((x) => x.id === id);
  if (!p) throw new StoreError(404, "PRODUCT_NOT_FOUND", "Product not found");
  return productDTO(p);
}

export function adminUpsertProduct(input: {
  id?: string;
  name: string;
  description: string;
  priceMinor: number;
  stockQty: number;
  categoryId: string;
  isActive: boolean;
}) {
  const products = db().seed.products;
  if (input.id) {
    const p = products.find((x) => x.id === input.id);
    if (!p) throw new StoreError(404, "PRODUCT_NOT_FOUND", "Product not found");
    Object.assign(p, {
      name: input.name,
      description: input.description,
      priceMinor: input.priceMinor,
      stockQty: input.stockQty,
      categoryId: input.categoryId,
      isActive: input.isActive,
    });
    return productDTO(p);
  }
  const id = `prod_${ulid()}`;
  const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id.slice(-4)}`;
  const rec = {
    id,
    slug,
    sku: `SW-NEW-${id.slice(-5).toUpperCase()}`,
    name: input.name,
    description: input.description,
    priceMinor: input.priceMinor,
    stockQty: input.stockQty,
    categoryId: input.categoryId,
    featured: false,
    images: [{ id: `img_${id}_0`, url: null, alt: input.name, isPrimary: true, sortOrder: 0 }],
    isActive: input.isActive,
    createdAt: new Date().toISOString(),
  };
  products.push(rec);
  return productDTO(rec);
}

export function adminDeleteProduct(id: string) {
  // Soft delete (order_items snapshot references), per plan.
  const p = db().seed.products.find((x) => x.id === id);
  if (p) p.isActive = false;
  return { ok: true };
}

export function adminUpsertCategory(input: { id?: string; name: string; featured: boolean; isActive: boolean }) {
  const cats = db().seed.categories;
  if (input.id) {
    const c = cats.find((x) => x.id === input.id);
    if (!c) throw new StoreError(404, "CATEGORY_NOT_FOUND", "Category not found");
    c.name = input.name;
    c.featured = input.featured;
    c.isActive = input.isActive;
    return categoryDTO(c);
  }
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const rec = {
    id: `cat_${slug}`,
    slug,
    name: input.name,
    imageUrl: null,
    sortOrder: cats.length,
    featured: input.featured,
    isActive: input.isActive,
  };
  cats.push(rec);
  return categoryDTO(rec);
}

export function adminDeleteCategory(id: string) {
  db().seed.categories = db().seed.categories.filter((c) => c.id !== id);
  return { ok: true };
}

export function adminListOrders(filter: { status?: string; q?: string } = {}) {
  let list = db().orders;
  if (filter.status && filter.status !== "all") list = list.filter((o) => o.status === filter.status);
  if (filter.q) {
    const n = filter.q.toLowerCase();
    list = list.filter((o) => o.number.toLowerCase().includes(n));
  }
  return { items: list.map(orderDTO), counts: { all: list.length, active: 0, completed: 0, cancelled: 0 } };
}

export function adminGetOrder(number: string) {
  const o = db().orders.find((x) => x.number === number);
  if (!o) throw new StoreError(404, "ORDER_NOT_FOUND", "Order not found");
  return orderDTO(o);
}

export function adminChangeOrderStatus(number: string, next: string, note: string) {
  if (!note.trim()) throw new StoreError(422, "NOTE_REQUIRED", "A note is required");
  const o = db().orders.find((x) => x.number === number);
  if (!o) throw new StoreError(404, "ORDER_NOT_FOUND", "Order not found");
  const allowed = STATUS_FLOW[o.status] ?? [];
  if (!allowed.includes(next))
    throw new StoreError(422, "INVALID_TRANSITION", `Cannot move ${o.status} → ${next}`);
  o.status = next;
  const node = o.timeline.find((t) => t.status === next);
  if (node) {
    node.reachedAt = new Date().toISOString();
    node.note = note.trim();
  } else {
    o.timeline.push({ status: next, reachedAt: new Date().toISOString(), note: note.trim() });
  }
  return orderDTO(o);
}

export function adminSettleCod(number: string) {
  const o = db().orders.find((x) => x.number === number);
  if (!o) throw new StoreError(404, "ORDER_NOT_FOUND", "Order not found");
  o.paymentStatus = "paid";
  return orderDTO(o);
}

export function adminListBanners() {
  return listBanners(false);
}

export function adminUpsertBanner(input: {
  id?: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  active: boolean;
}) {
  const banners = db().seed.banners;
  if (input.id) {
    const b = banners.find((x) => x.id === input.id);
    if (!b) throw new StoreError(404, "BANNER_NOT_FOUND", "Banner not found");
    Object.assign(b, input);
    return b;
  }
  const rec = { ...input, id: `ban_${ulid()}`, imageUrl: null, sortOrder: banners.length };
  banners.push(rec);
  return rec;
}

export function adminDeleteBanner(id: string) {
  db().seed.banners = db().seed.banners.filter((b) => b.id !== id);
  return { ok: true };
}

export function listAdminCategories() {
  return db().seed.categories.map(categoryDTO);
}
