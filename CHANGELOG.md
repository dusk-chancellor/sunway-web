# Changelog

Notable changes to `sunway-web`. Dates are the dates the work landed on `main`.
For the current state of the system, see the [root README](../README.md); for the
reasoning behind these changes, see [`DECISIONS.md`](DECISIONS.md).

## Unreleased — Uzum Nasiya installments (branch `integration-uzum`)

### Added
- **Uzum Nasiya as a fourth payment method.** A checkout panel that qualifies the
  customer against Uzum (eligibility, then their plans priced for the current
  cart) before a plan can be chosen, a contract summary on the confirmation page
  and in the admin order detail, and a full `nasiya` message set in all three
  locales — including one line per Uzum user-status code, so a customer is told
  which document is missing rather than "finish registration".
- `POST /orders/{number}/sync-payment` is called when the customer returns from
  the signing WebView (and by "check status again"): the return itself proves
  nothing, and for installments this is what confirms the contract.
- `UzumNasiyaLogo`, and a wordmark fallback for all three brand marks so a
  missing image never makes a payment method unpickable.

### Changed
- **The delivery fee is no longer a priced line.** It is collected in cash by the
  courier for every payment method, so `shippingMethodSchema` lost `priceMinor`,
  the checkout total is the cart subtotal, and a shipping row renders only for
  historical orders that carry one.
- `paymentMethod` gained `uzum_nasiya`; `orderSchema` gained a nullable `nasiya`
  contract; retrying an installment payment resumes the existing contract rather
  than opening a second one.
- Uzum's "over your limit" explanation is Russian-only, so it is shown to Russian
  readers and replaced with a translated line for everyone else.

## 1.0.0 — Go backend integration & production readiness (2026-06 → 2026-07)

The app stopped being a self-contained demo and became a client of the real Go
API, then gained the localization, payment, and polish work needed to launch.

### Added
- **Localization for real**: Russian and Uzbek translated in full alongside
  English, selectable from a header switcher (cookie-based, no URL prefixes) with
  country flag icons in `public/flags/`.
- **Per-locale content editing** in the admin panel (`TranslationsEditor`) for
  products, categories, banners, shipping methods, and static pages, with
  fallback to the base value when an override is blank.
- **PayMe / Click / cash-on-delivery** checkout: brand-logo payment selection,
  redirect to the provider's hosted page via the order's `paymentRedirectUrl`,
  and settlement driven by the backend callback rather than the redirect return.
- Locale is sent with OTP requests and order placement so the backend's SMS goes
  out in the customer's language.
- `RichText` + `renderRichText`: a safe Markdown subset (bold, italic,
  paragraphs, line breaks) for admin-authored descriptions — escaped, tag-limited,
  then DOMPurify-sanitized.
- `/uploads/*` rewritten through the web origin to the backend, so stored image
  URLs never bake in a host.
- Sunburst brand background echoing the logo mark.
- Security headers (`X-Content-Type-Options`, `X-Frame-Options: DENY`, strict
  referrer policy).

### Changed
- All data now comes from the Go API (`NEXT_PUBLIC_API_URL`, which must include
  `/api/v1`). Zod schemas remain the contract and parse every response.
- Money accepts a JSON number or string on the wire and is parsed to `bigint`
  minor units; formatting still happens only in `<Money>`.
- Session cookies renamed to match the backend: `sw_refresh` (refresh) and
  `sw_cart` (guest cart).
- The dev OTP hint became API-driven — it renders only when the response carries
  a `devCode`, which production never returns.
- Next.js upgraded to 15.5.20 (security patch).

### Removed
- The local mock API: `app/api/v1/*` route handlers and the `src/server/`
  in-memory store, along with the offline demo mode they provided.
- The fake card-input form (replaced by real hosted-checkout redirects).
- The hardcoded `000000` dev code and the prefilled admin phone.

### Fixed
- Admin panel: create/edit forms could not scroll on short viewports.
- Admin panel: unknown routes returned a 200 instead of a real 404 status.
- Product descriptions collapsed multi-paragraph text into a single line.

## 0.1.0 — Initial frontend build (2026-05-30)

> Historical. This release ran entirely against an in-memory backend that no
> longer exists; see *Superseded* in [`DECISIONS.md`](DECISIONS.md).

### Added
- Next.js 15 (App Router, React 19, TypeScript strict) storefront + admin in one
  codebase.
- **Storefront**: homepage (hero + featured categories/products), category pages
  with filters/sort/pagination, product detail with JSON-LD, search, cart, guest
  + authenticated checkout, order confirmation, account (profile, addresses,
  orders, wishlist), legal pages.
- **Admin panel** (`/admin`): OTP login, dashboard (revenue MTD, orders-today by
  status, low stock, SMS failures), product CRUD, category CRUD, order list +
  detail with state-machine status changes (required note) and COD settlement,
  banner CRUD.
- **Local API**: 34 Next.js route handlers under `app/api/v1/*` backed by an
  in-memory store with deterministic seed data.
- OTP auth (in-memory access token + httpOnly refresh/cart cookies), silent
  refresh-and-retry, idempotent order placement.
- Zod schemas as the single source of truth for all types; money as bigint minor
  units, string on the wire.
- Brand design system via Tailwind v4 `@theme` tokens; sunburst logo; branded
  image placeholders.
- next-intl scaffolding (en live; ru/uz stubbed).

### Notes
- Tailwind pinned to 4.1.13 (4.0.0 was build-incompatible).
- Fonts loaded at runtime so the build works offline.
