# Decisions & deviations

Why the frontend is built the way it is: the choices that a reader would
otherwise mistake for accidents, and the places the implementation deliberately
departs from the original prompt.

Decisions that no longer hold are kept at the bottom under
[Superseded](#superseded) rather than deleted — the reasoning is still useful,
but nothing above that line describes code that exists.

---

## Current

### One contract, no BFF

The browser calls the Go API directly. `apiFetch` prefixes every path with
`NEXT_PUBLIC_API_URL`, and the zod schemas in `src/lib/validation/schemas.ts` are
the single source of truth for the wire format — the Go handlers were shaped to
emit exactly those camelCase DTOs. No translation layer, no route handlers, no
duplicated types.

### Admin is path-routed (`/admin/*`), not host-routed

The spec hinted at a separate admin host. Hosting the admin under a path prefix
in the same app avoids Next.js parallel-route collisions and keeps one
deployable. The dashboard chrome lives in `app/admin/(dashboard)/layout.tsx`;
`/admin/login` sits outside that group so it renders without the sidebar.

Access is checked in three places, and only one of them counts: `middleware.ts`
(session-cookie presence — a redirect convenience), the client layout (role
check — a UI convenience), and the Go API, which returns **404** rather than 403
to authenticated non-admins so the panel's existence is never disclosed. Treat
the first two as cosmetics; never move an authorization rule into them.

### Auth: OTP only, access token in memory

Phone-only OTP — no password, no email, no OAuth (all stripped from the
mockups). The access token is held **in memory** so an XSS foothold can't read it
from storage; the refresh token is an httpOnly cookie (`sw_refresh`) set by the
backend, and the guest cart is an httpOnly cookie (`sw_cart`). `apiFetch` does one
silent refresh-and-retry on a 401, de-duplicated so concurrent 401s trigger a
single refresh.

The dev OTP hint is **API-driven**: the form renders whatever `devCode` the
response carries, and prod never sends one. No hardcoded bypass code exists in
this app, and the admin phone is not prefilled — both were removed so a demo
affordance can't survive into production by accident.

### Money is bigint minor units, formatted only at the edge

Prices are integer tiyin everywhere in transit and in app state, held as
`bigint`. The `moneyMinor` zod transform accepts a JSON number *or* a string
(the backend sends numbers on reads and takes strings on admin writes, and
bigint-safety matters more than uniformity), and `<Money>` at the render boundary
is the only place a value becomes a human string. Sums use bigint arithmetic;
`parseFloat` on a price is a bug.

### Payment is a redirect to a hosted page

The customer chooses **Pay online** (PayMe, Click or Uzum Nasiya) or **cash on
delivery**. Online orders come back with a `paymentRedirectUrl` and the browser
leaves the site; what marks the order paid is always the backend — a provider
callback for the card gateways, its own confirmation call for installments —
never the redirect return. Card data therefore never touches this app, and the
confirmation page only *reflects* payment state.

### Installments qualify the customer before they are offered a price

Uzum Nasiya is the only method with a gate in front of it: the customer has to be
registered and verified with Uzum, and the plans they get depend on their
remaining limit. So picking the tile loads two calls (`/nasiya/status`, then
`/nasiya/quote` priced for the current cart) rather than showing a static
"12 months" option that might not exist for them.

Two consequences worth stating:

- **A plan must be selected before the order can be placed.** The contract is
  written against exactly one tariff; there is no sensible default to pick on the
  customer's behalf.
- **Returning from the signing WebView triggers a call, not a conclusion.** The
  confirmation page fires `/orders/{number}/sync-payment` on arrival because
  signing does not activate a contract — the backend still has to confirm it. The
  page is a trigger and a mirror, never the thing that settles an order.

The status codes are translated one by one instead of collapsing into "finish
registration", because Uzum tells us exactly which document is missing (a selfie
with the passport, the residence page, a contact person) and that converts far
better than a generic prompt. Code 14 is worded carefully: it means the customer
can't buy on credit *here*, not that they were rejected as a borrower.

### The delivery fee is cash-only and unpriced

Delivery is quoted and collected in cash by the courier, for every payment
method. Rather than model a partly-financed order, shipping methods simply carry
no price: an order total is its goods total, and that single number is what every
gateway charges and what Uzum finances. Orders placed before this rule keep their
stored `shippingMinor`, which is why the shipping row still renders when it is
non-zero.

### Order placement carries an idempotency key

Checkout generates a ULID `Idempotency-Key`, holds it in a ref across retries, and
regenerates it only after a stock conflict (which is a genuinely new attempt).

The key is sent in anticipation: **the Go API does not honour it yet.** What
actually prevents a duplicate order today is the checkout transaction emptying
the cart — a second submit finds nothing to buy and fails with "cart is empty".
That contains the damage but returns an error instead of replaying the original
response, so the client keeps sending the key and the fix belongs in the API.

### SSR for SEO, client fetching for interaction

Home, category, product, search, and legal pages render on the server so crawlers
see real content (product pages also emit JSON-LD). Everything interactive —
cart, checkout, account, admin — is client-side through TanStack Query. Both go
through the same typed resource layer.

### i18n: cookie-based, no URL prefixes

next-intl with three live locales (en/ru/uz). The locale is a cookie
(`NEXT_LOCALE`), not a URL segment: it keeps one canonical URL per page (no
`/ru/...` duplicates to manage for SEO or to rewrite in the middleware), which is
the right trade for a single-market store.

Admin-authored content is localized separately, as a `translations` jsonb blob
per row (`{ locale: { field: value } }`) with the base column as fallback, rather
than as translated sibling tables. Blank means "fall back" — the manager
translates what matters and ignores the rest.

### Tailwind v4 CSS-first, no config file

Design tokens live in `@theme` inside `src/styles/globals.css`; there is no
`tailwind.config.ts`. Base element styles sit inside `@layer base` so utility
classes always win — unlayered rules like `a { color: inherit }` would otherwise
beat `text-white` and make navy buttons invisible.

Tailwind is pinned to `4.1.13`: the original `4.0.0` pin is incompatible with the
current Rust scanner and fails the build with `Missing field 'negated'`.

### Fonts loaded at runtime, not via `next/font`

`next/font/google` fetches at **build time**, which breaks `pnpm build` in
offline, CI, or air-gapped environments. The brand fonts (Sora, Plus Jakarta
Sans, JetBrains Mono) are loaded with a `<link>` in the root layout and the
`--font-*` tokens fall back to a system stack. Trade-off: no build-time
self-hosting or subsetting — acceptable at this stage.

### Admin rich text is a tiny Markdown subset, not an HTML editor

Product descriptions and pages are authored as Markdown. `renderRichText`
escapes the input first, emits only bold/italic/paragraph/break tags, then
sanitizes with DOMPurify — so raw HTML pasted by an admin can never render. This
exists because descriptions typed with blank lines were collapsing into one
paragraph on the storefront.

### The sunburst background is deliberate

The ambient page background is a CSS sunburst — a radial yellow core plus a
repeating conic ray pattern — echoing the logo mark. It is a brand element, not
a stray gradient. Don't "clean it up" to a flat white.

### No discount codes, no analytics, no reviews

Dropped from all UI per the §17 decisions. Wishlist is retained. The admin
dashboard (revenue MTD, orders-today by status, low stock, SMS failures) is the
only analytics surface.

### Testing deferred

No Storybook, Playwright, or automated axe checks. Accessibility is maintained by
hand: labels, focus management, modal focus traps, skip link, `aria-pressed` on
toggles, alt text. This remains the largest known gap in the frontend.

---

## Superseded

These decisions shaped earlier versions of this app and no longer describe the
code. Kept for the reasoning.

### ~~Backend stand-in: local Route Handlers instead of MSW~~

The Go backend did not exist when this app was first built, so it shipped a real
local API — Next.js route handlers under `app/api/v1/*` over an in-memory
singleton store in `src/server/` — chosen after MSW failed badly on a previous
attempt. SSR pages read the store directly to avoid a build-time self-fetch.

**Superseded:** both directories were deleted when the Go API landed. The app now
always talks to `NEXT_PUBLIC_API_URL`, and the offline demo mode is gone.

### ~~Money on the wire is a string~~

Originally always serialized as a string for bigint safety. **Superseded:** the Go
API sends JSON numbers on reads and accepts strings on admin writes; the
`moneyMinor` transform accepts both. Internally money is still bigint minor
units — that part never changed.

### ~~Cookies named `sunway_session` / `sunway_cart`~~

**Superseded:** the Go backend sets `sw_refresh` and `sw_cart`; the middleware and
client match those names.

### ~~Dev OTP `000000` always works; admin phone prefilled~~

Convenient against the in-memory backend. **Superseded:** removed so no demo
affordance could reach production. The real dev path is the backend's `devCode`,
which prod never returns.

### ~~Card payment is a non-charging form~~

An explicit instruction overriding spec §16: a plain card-input form that was
never submitted anywhere, marking card orders `paid` immediately.
**Superseded** by real PayMe and Click hosted-checkout redirects with
callback-driven settlement.

### ~~i18n: single active locale~~

`en` live with `ru`/`uz` scaffolded as copies, per an "English-only at launch"
decision. **Superseded:** all three are fully translated and selectable, and
admin-authored content carries per-locale overrides.
