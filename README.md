# Sunway — Web (storefront + admin)

The Next.js 15 frontend for **Sunway**, a general-retail online store in
Uzbekistan. One codebase, one deployable, two audiences:

- the **public storefront** at `/` — catalog, search, cart, checkout, account;
- the **admin panel** at `/admin` — catalog, banners, pages, and order management
  for the sales manager.

It is a pure client of the Go API in [`../sunway-backend`](../sunway-backend).
There is no local backend here: every request goes to `NEXT_PUBLIC_API_URL`.

> For the whole system — architecture, the API contract, order/payment
> workflows, deployment — see the **[root README](../README.md)**. This file
> covers only what is specific to the frontend.

---

## Quick start

Requirements: **Node 20+** (tested on 22) and **pnpm 9**.

The Go API must be running first (`cd ../sunway-backend && make up`, or
`make run` against a local Postgres; `make seed` loads demo data).

```bash
corepack enable          # makes pnpm available if it isn't already
pnpm install
pnpm dev                 # http://localhost:3000
```

`.env.local` is already present for local work and points at
`http://localhost:8080/api/v1`. `.env` next to it is the annotated template
(production values, copy it to `.env.local` and edit). Both are gitignored — the
`.gitignore` excludes `.env*` — so on Vercel these go in the project's
**Environment Variables**, not in a committed file.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Go API base — **must include the `/api/v1` suffix** |
| `NEXT_PUBLIC_CURRENCY` | display currency (ISO 4217), `UZS` |

### Production build

```bash
pnpm build && pnpm start
```

### Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | dev server (storefront + admin) |
| `pnpm dev:admin` | same, with `APP_TARGET=admin` |
| `pnpm build` / `pnpm start` | production build / serve it |
| `pnpm lint` | ESLint (`no-explicit-any` is an **error**) |
| `pnpm typecheck` | `tsc --noEmit`, strict |

---

## Signing in

Auth is **passwordless OTP over SMS** — phone only, no passwords, no email, no
OAuth.

- **Customer:** any valid `+998…` number at `/login`; the first successful verify
  creates the account.
- **Sales manager:** `/admin/login`. The seeded dev account is `+998901112233`
  (loaded by the backend's `make seed`). The field is **not** prefilled.

In development the backend returns the code as `devCode` and the form renders it
as an on-screen hint. That hint is entirely API-driven — production
(`APP_ENV=prod`) never returns `devCode`, so it simply never appears. There is no
hardcoded bypass code in this app.

---

## Layout

```
app/
  (shop)/                storefront
    page.tsx             home — hero carousel, featured categories, product grid
    c/[slug]/            category (sort + pagination)
    p/[slug]/            product detail (gallery, JSON-LD, add to cart/wishlist)
    search/              full-text search results
    cart/  checkout/     cart view; checkout (address, shipping, payment)
    orders/[number]/confirmation/
    account/             profile · orders · wishlist
    login/  register/    OTP flows
    (legal)/[slug]/      admin-authored static pages
  admin/
    login/               OTP login, role-checked
    (dashboard)/         dashboard · products · categories · banners · orders
  layout.tsx  error.tsx  global-error.tsx  not-found.tsx
src/
  components/
    ui/                  primitives: Button, Input, Select, Modal, Drawer, Toaster, …
    shared/              Money, Logo, RichText, StatusBadge, LocaleSwitcher,
                         PaymentLogos, ProductImage, ClientOnly
    storefront/          Header, Footer, CategoryNav, HeroCarousel, ProductCard,
                         ProductGallery, CartDrawer, MobileNav, OtpForm
    admin/               AdminSidebar, AdminTopbar, AdminTable, ImageUploader,
                         MarkdownTextarea, TranslationsEditor
  lib/
    api/client.ts        apiFetch: auth header, request id, error envelope,
                         one silent refresh-and-retry on 401
    api/token.ts         in-memory access-token store
    api/resources/       typed fetchers per area (catalog, cart, orders, admin, …)
    api/hooks/           TanStack Query hooks
    validation/schemas.ts  zod — the single source of truth for every type
    format/              money · phone · date · richtext
    i18n/content.ts      per-locale field resolution with fallback
    auth/AuthProvider.tsx  session bootstrap + login/logout
    cart/useCart.ts
  i18n/                  next-intl config, cookie-based request.ts, messages/
  stores/ui.ts           zustand (UI state only)
  styles/globals.css     Tailwind v4 @theme tokens + the sunburst background
middleware.ts            edge gate for /checkout, /account/*, /admin/*
public/                  payme.png, click.png, flags/{us,ru,uz}.svg
```

---

## How data flows

**Reads.** SEO-critical routes (home, category, product, search, legal) render on
the server. Everything interactive fetches through TanStack Query. Both paths go
through the same typed resource functions, and every response is parsed by its
zod schema at the boundary — a shape change fails loudly instead of leaking
`undefined` into the UI.

**Auth.** The access token lives **in memory only** (never `localStorage`); the
refresh token is an httpOnly cookie (`sw_refresh`) set by the Go backend, so a
reload silently re-authenticates. `apiFetch` performs exactly one refresh-and-retry
on a 401, de-duplicated across concurrent requests.

**Writes.** Mutations post JSON and invalidate the affected query keys. Order
placement carries an `Idempotency-Key` — a ULID held in a ref, regenerated only
after a stock conflict, which is a genuinely new attempt. Note that the backend
does not honour that header yet (see the backend's *Known gaps*): today a
double-submit is contained by the checkout transaction clearing the cart, so the
retry fails with "cart is empty" rather than placing a second order. The client
side is ready for real idempotency when the API implements it.

**Money.** Integer **minor units** (tiyin) end to end, held as `bigint`. The
`moneyMinor` zod transform accepts a JSON number or string and parses it;
arithmetic is bigint-only, and `<Money>` at the render boundary is the one place
a value becomes a human string. Never `parseFloat` a price.

**Images.** Uploads live on the Go backend under `/uploads/*`;
[`next.config.ts`](next.config.ts) derives the backend origin from
`NEXT_PUBLIC_API_URL` and rewrites `/uploads/*` through the web origin, so stored
URLs never bake in a host.

**Checkout → payment.** The customer picks **Pay online** (then PayMe, Click or
Uzum Nasiya by logo) or **cash on delivery**. Placing an order returns the order;
if it carries a `paymentRedirectUrl`, the browser leaves the site for the
provider's hosted page. The order is confirmed by the backend — a provider
callback, or for installments the backend's own confirmation call — **never** by
the redirect return. The confirmation page reflects that state, it doesn't create
it. Card data never touches this app.

**Installments (Uzum Nasiya).** Choosing it loads two authenticated calls:
`/nasiya/status` (is this customer eligible? if not, exactly which document is
missing) and `/nasiya/quote` (their plans priced for the current cart, so the
monthly payment shown is real). A plan must be selected before the order can be
placed, because the contract is written against exactly one plan. After signing
in Uzum's WebView the customer lands back on the confirmation page, which calls
`/orders/{number}/sync-payment` on arrival — signing alone settles nothing, and
that call is what asks the backend to confirm the contract. The partner token
never reaches the browser.

**Delivery fee.** It is quoted and collected in cash by the courier, for every
payment method, so shipping methods carry no price and an order total is its
goods total. Orders placed before that rule still render their stored
`shippingMinor`.

---

## Localization

Three live locales: **English, Russian, Uzbek**. Selection is cookie-based
(`NEXT_LOCALE`) with **no URL-prefix routing**; the header switcher writes the
cookie and shows a flag from `public/flags/`.

Two distinct layers:

- **UI strings** — `src/i18n/messages/{en,ru,uz}.json` via next-intl.
- **Admin-authored content** — products, categories, banners, shipping methods
  and pages carry a `translations` object (`{ locale: { field: value } }`), edited
  with `TranslationsEditor`. `localized()` resolves a field for the active locale
  and falls back to the base value when an override is blank.

The locale also travels to the backend: OTP requests and order placement send it
so SMS goes out in the customer's language. (The backend's SMS templates cover
**ru/uz only**, defaulting to ru — Eskiz moderates each text per language.)

---

## Design system

Brand tokens live in `@theme` inside [`src/styles/globals.css`](src/styles/globals.css)
— navy `#0f1860`, sun-yellow `#ffd400`, the radius/shadow scale, and the display /
body / mono font stacks. There is **no `tailwind.config.ts`**; Tailwind v4 is
CSS-first and pinned to `4.1.13`.

The page background is a deliberate CSS **sunburst** — a radial sun core plus a
repeating conic ray pattern echoing the logo mark. It is intentional, not an
artifact; don't flatten it to white.

Fonts (Sora, Plus Jakarta Sans, JetBrains Mono) are loaded with a runtime `<link>`
rather than `next/font`, so builds succeed with no network access; the token
stacks fall back to system fonts.

Admin-authored product descriptions render through `RichText`, which supports a
tiny Markdown subset (bold, italic, paragraphs, line breaks): the input is
HTML-escaped first, only a fixed tag set is emitted, and the result is sanitized
with DOMPurify — raw HTML in the source can never render.

---

## Conventions

- **No `any`, no `@ts-ignore`.** ESLint treats `no-explicit-any` as an error.
- **Zod is the contract.** Types are inferred from schemas, never hand-written
  alongside them.
- **No reviews or ratings** anywhere; wishlist is kept.
- **Admin is path-routed**, not host-routed, and never trusted client-side: the
  middleware and layout checks are convenience, the backend's 404-for-non-admins
  is the real boundary.
- **Accessibility is hand-maintained**: labelled inputs, visible focus rings,
  modal focus trapping, skip link, `aria-pressed` on toggles, alt text.
- Security headers (`X-Content-Type-Options`, `X-Frame-Options: DENY`, strict
  referrer policy) are set in `next.config.ts`.

---

## Deploying

Vercel: import the repo, set **Root Directory** to `sunway-web`, add the two
environment variables (Production + Preview), deploy. Put the API on a **sibling
subdomain** of the storefront (`api.example.uz` / `example.uz`) so the
`sw_refresh` cookie stays first-party, and set the backend's `COOKIE_DOMAIN`
accordingly.

Full checklist: [`../PRODUCTION.md`](../PRODUCTION.md).

---

## Related documents

| Document | Covers |
|---|---|
| [`../README.md`](../README.md) | the whole system — start here |
| [`DECISIONS.md`](DECISIONS.md) | why the frontend is built the way it is |
| [`CHANGELOG.md`](CHANGELOG.md) | what changed, when |
| [`../PRODUCTION.md`](../PRODUCTION.md) | dev vs prod, deployment, pre-launch checklist |
