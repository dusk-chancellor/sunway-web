/**
 * Deterministic seed data for the built-in local API. Money is stored as an
 * integer number of minor units (tiyin) internally; it is serialised to a
 * string at the DTO boundary so the wire format is bigint-safe.
 *
 * Image URLs are intentionally null — the UI renders the branded striped
 * placeholder (matching the mockups). Swap in real /media/* URLs later.
 */
import { ulid } from "@/lib/utils/ids";

export interface SeedImage {
  id: string;
  url: string | null;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}
export interface SeedProduct {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  priceMinor: number;
  stockQty: number;
  categoryId: string;
  featured: boolean;
  images: SeedImage[];
  isActive: boolean;
  createdAt: string;
}
export interface SeedCategory {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
  featured: boolean;
  isActive: boolean;
}
export interface SeedBanner {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
}
export interface SeedPage {
  slug: string;
  title: string;
  html: string;
  updatedAt: string;
}
export interface SeedShipping {
  id: string;
  name: string;
  description: string;
  priceMinor: number;
  sortOrder: number;
}
export interface SeedUser {
  id: string;
  phone: string;
  fullName: string;
  email: string | null;
  dob: string | null;
  role: "customer" | "sales_manager";
}
export interface SeedAddress {
  id: string;
  userId: string;
  fullName: string;
  country: string;
  region: string;
  city: string;
  street: string;
  apartment: string | null;
  postalCode: string | null;
  isDefault: boolean;
}

const SUM = 100; // 1 so'm = 100 tiyin; helper to express prices in so'm

const CATEGORY_DEFS: Array<[string, string, boolean]> = [
  ["Electronics", "electronics", true],
  ["Home & Kitchen", "home-kitchen", true],
  ["Rack Shelves", "rack-shelves", true],
  ["Tools & Hardware", "tools-hardware", true],
  ["Sports & Outdoor", "sports-outdoor", false],
  ["Beauty & Care", "beauty-care", false],
  ["Toys & Games", "toys-games", false],
  ["Office & Stationery", "office-stationery", false],
];

const ADJ = ["Compact", "Premium", "Classic", "Smart", "Pro", "Eco", "Ultra", "Everyday", "Heavy-duty", "Lightweight"];
const NOUNS: Record<string, string[]> = {
  electronics: ["Wireless Earbuds", "Power Bank", "Bluetooth Speaker", "USB-C Charger", "LED Desk Lamp", "Action Camera", "Smart Plug", "Noise-cancel Headphones"],
  "home-kitchen": ["Ceramic Mug Set", "Steel Kettle", "Knife Block", "Storage Jars", "Frying Pan", "Cutting Board", "Spice Rack", "Dish Rack"],
  "rack-shelves": ["5-Tier Rack", "Corner Shelf", "Wall Bracket Set", "Garage Shelving", "Bookshelf Unit", "Floating Shelf", "Wire Rack", "Pantry Organiser"],
  "tools-hardware": ["Screwdriver Set", "Cordless Drill", "Tape Measure", "Tool Box", "Allen Key Set", "Utility Knife", "Spirit Level", "Pliers Kit"],
  "sports-outdoor": ["Yoga Mat", "Water Bottle", "Camping Lantern", "Resistance Bands", "Dumbbell Pair", "Backpack 30L", "Jump Rope", "Trekking Poles"],
  "beauty-care": ["Hair Dryer", "Facial Roller", "Electric Trimmer", "Makeup Mirror", "Nail Care Set", "Bath Towel Set", "Aroma Diffuser", "Comb Set"],
  "toys-games": ["Building Blocks", "Plush Bear", "Puzzle 1000pc", "Toy Car Set", "Board Game", "Kite", "Card Deck", "Drawing Kit"],
  "office-stationery": ["Notebook Pack", "Gel Pen Set", "Desk Organiser", "Stapler Kit", "Whiteboard", "File Folders", "Sticky Notes", "Calculator"],
};

function priceFor(i: number): number {
  // 49,000 — 1,290,000 so'm range, varied but deterministic
  const base = 49000 + ((i * 37) % 124) * 10000;
  return base * SUM;
}

export function buildSeed() {
  const createdBase = Date.parse("2026-01-10T09:00:00Z");

  const categories: SeedCategory[] = CATEGORY_DEFS.map(([name, slug, featured], i) => ({
    id: `cat_${slug}`,
    slug,
    name,
    imageUrl: null,
    sortOrder: i,
    featured,
    isActive: true,
  }));

  const products: SeedProduct[] = [];
  let idx = 0;
  for (const cat of categories) {
    const nouns = NOUNS[cat.slug] ?? [];
    for (let n = 0; n < nouns.length; n++) {
      const adj = ADJ[(idx + n) % ADJ.length];
      const name = `${adj} ${nouns[n]}`;
      const slug = `${cat.slug}-${nouns[n]!.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${n}`;
      const stock = (idx * 7) % 17; // produces some 0 (out), some <5 (low), some plenty
      products.push({
        id: `prod_${idx}`,
        slug,
        sku: `SW-${cat.slug.slice(0, 3).toUpperCase()}-${String(1000 + idx)}`,
        name,
        description:
          `The ${name} blends durable construction with a clean, modern look. ` +
          `Ideal for everyday use, it ships ready to go and is backed by Sunway's ` +
          `local delivery and support. Lightweight, reliable, and easy to maintain.`,
        priceMinor: priceFor(idx),
        stockQty: stock,
        categoryId: cat.id,
        featured: idx % 9 === 0,
        images: [
          { id: `img_${idx}_0`, url: null, alt: name, isPrimary: true, sortOrder: 0 },
          { id: `img_${idx}_1`, url: null, alt: `${name} alternate view`, isPrimary: false, sortOrder: 1 },
        ],
        isActive: true,
        createdAt: new Date(createdBase + idx * 3600_000).toISOString(),
      });
      idx++;
    }
  }

  const banners: SeedBanner[] = [
    { id: "ban_1", title: "Everything for your home", subtitle: "Up to 30% off home & kitchen essentials this week.", ctaLabel: "Shop home", ctaHref: "/c/home-kitchen", imageUrl: null, sortOrder: 0, active: true },
    { id: "ban_2", title: "Build your space", subtitle: "Rack shelves and storage that fit any room.", ctaLabel: "Browse shelves", ctaHref: "/c/rack-shelves", imageUrl: null, sortOrder: 1, active: true },
    { id: "ban_3", title: "Fast local delivery", subtitle: "Order today, get it delivered across the region.", ctaLabel: "Start shopping", ctaHref: "/c/electronics", imageUrl: null, sortOrder: 2, active: true },
  ];

  const pageBody = (p: string) =>
    `<h2>${p}</h2><p>This is placeholder content for the <strong>${p}</strong> page. ` +
    `In production the sales manager edits this copy from the admin panel and it is ` +
    `stored as markdown, rendered to HTML on the server.</p>` +
    `<p>Sunway is a general-retail online store offering local delivery and both ` +
    `online card and cash-on-delivery payment.</p>`;
  const pages: SeedPage[] = [
    { slug: "about", title: "About Sunway", html: pageBody("About Sunway"), updatedAt: new Date(createdBase).toISOString() },
    { slug: "contacts", title: "Contacts", html: `<h2>Contacts</h2><p>Phone: +998 71 200 00 00</p><p>Address: Tashkent, Uzbekistan</p>`, updatedAt: new Date(createdBase).toISOString() },
    { slug: "delivery", title: "Delivery & Payment", html: `<h2>Delivery &amp; Payment</h2><p>We deliver across the region using our own couriers. Pay online by card or with cash on delivery.</p>`, updatedAt: new Date(createdBase).toISOString() },
    { slug: "terms", title: "Terms of Use", html: pageBody("Terms of Use"), updatedAt: new Date(createdBase).toISOString() },
    { slug: "privacy", title: "Privacy Policy", html: `<h2>Privacy Policy</h2><p>We collect your phone, name, optional email, delivery addresses and order history to fulfil orders. Orders are retained for 5 years for tax purposes; one-time codes for 10 minutes.</p>`, updatedAt: new Date(createdBase).toISOString() },
  ];

  // Shipping tiers taken from the checkout mockup, priced in UZS.
  const shipping: SeedShipping[] = [
    { id: "ship_standard", name: "Standard delivery", description: "3–5 business days", priceMinor: 25000 * SUM, sortOrder: 0 },
    { id: "ship_express", name: "Express delivery", description: "1–2 business days", priceMinor: 49000 * SUM, sortOrder: 1 },
    { id: "ship_sameday", name: "Same-day delivery", description: "Before 22:00 today", priceMinor: 79000 * SUM, sortOrder: 2 },
  ];

  // One seeded sales-manager account (per ToR: single admin account).
  const adminId = "user_admin";
  const users: SeedUser[] = [
    { id: adminId, phone: "+998901112233", fullName: "Sales Manager", email: null, dob: null, role: "sales_manager" },
  ];
  const addresses: SeedAddress[] = [];

  return { categories, products, banners, pages, shipping, users, addresses };
}

export type Seed = ReturnType<typeof buildSeed>;
export const ADMIN_PHONE = "+998901112233";
// silence unused import in some build modes
void ulid;
