# Changelog

## 0.1.0 — Initial frontend build

### Added
- Next.js 15 (App Router, React 19, TypeScript strict) storefront + admin in one
  codebase.
- **Storefront**: homepage (hero + featured categories/products), category pages
  with filters/sort/pagination, product detail with JSON-LD, search, cart, guest
  + authenticated checkout (3 shipping tiers, card/COD), order confirmation,
  account (profile, addresses, orders, wishlist), legal pages.
- **Admin panel** (`/admin`): OTP login, dashboard (revenue MTD, orders-today by
  status, low stock, SMS failures), product CRUD, category CRUD, order list +
  detail with state-machine status changes (required note) and COD settlement,
  banner CRUD.
- **Local API**: 34 Next.js route handlers under `app/api/v1/*` backed by an
  in-memory store with deterministic seed data (8 categories, ~64 products,
  banners, static pages, shipping tiers, seeded admin).
- OTP auth (in-memory access token + httpOnly refresh/cart cookies), silent
  refresh-and-retry, idempotent order placement.
- Zod schemas as the single source of truth for all types; money as bigint
  minor units, string on the wire.
- Brand design system via Tailwind v4 `@theme` tokens; sunburst logo; branded
  image placeholders.
- next-intl scaffolding (en live; ru/uz stubbed).

### Notes
- Tailwind pinned to 4.1.13 (4.0.0 was build-incompatible).
- Fonts loaded at runtime so the build works offline.
- See `DECISIONS.md` for all deviations.
