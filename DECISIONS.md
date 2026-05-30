# Decisions & deviations

This document records every place the implementation deliberately departs from
the original prompt, plus the architectural choices made because the Go backend
and `openapi.yaml` did not exist at build time.

## Backend stand-in: local Route Handlers instead of MSW

The prompt assumed a backend (or MSW mocks). The previous attempt failed badly
with MSW, so this build implements a **real local API** as Next.js Route
Handlers under `app/api/v1/*`, backed by an in-memory singleton store
(`src/server/`). It runs with `pnpm dev`, needs no external service, and is
swapped for the Go backend by flipping `NEXT_PUBLIC_API_URL` (see README). No
MSW anywhere.

SSR pages read the store **directly** (server-only import); client components go
through `apiFetch` → route handlers. This avoids build-time self-fetch.

## Admin is path-routed (`/admin/*`), not host-routed

The spec hinted at a separate admin host. Hosting admin under a path prefix in
the same app avoids Next.js parallel-route collisions and keeps one deployable.
The dashboard chrome lives in `app/admin/(dashboard)/layout.tsx`; `/admin/login`
sits outside that group so it renders without the sidebar. Role is checked both
in `middleware.ts` (cookie presence) and the client layout (`sales_manager`).

## Money on the wire is a string

Stored internally as integer tiyin. Serialized as a **string** so large values
are bigint-safe across JSON. Zod coerces string→bigint at the boundary; `<Money>`
is the only place values are formatted (UZS, no fraction digits).

## Auth model

OTP-only (phone, no password, no OAuth, no email — all stripped from mockups).
Access token kept **in memory** (never localStorage); refresh token in an
httpOnly cookie `sunway_session`; guest cart in httpOnly cookie `sunway_cart`.
`apiFetch` performs one silent refresh-and-retry on 401. Dev OTP is logged to
the server console and `000000` always works. Seeded admin: `+998901112233`.

`requireAdmin` returns **404** (not 403) for authenticated non-admins so the
panel's existence isn't disclosed.

## Tailwind v4 CSS-first, no config file

Design tokens live in `@theme` inside `src/styles/globals.css`; there is no
`tailwind.config.ts`. Tailwind packages are pinned to `4.1.13` (the `4.0.0`
pin from the original lockset is incompatible with the current Rust scanner and
fails the build with a `Missing field 'negated'` error).

## Fonts loaded at runtime, not via `next/font`

`next/font/google` fetches fonts at **build time**, which breaks `pnpm build` in
offline/CI/air-gapped environments. Instead the brand fonts (Sora, Plus Jakarta
Sans, JetBrains Mono) are loaded with a `<link>` in the root layout, and the
`--font-*` tokens fall back to a system stack if the network is unavailable. The
build therefore succeeds with no network access. (Trade-off: no build-time
self-hosting/subsetting; acceptable for this stage.)

## i18n: single active locale

`next-intl` is wired with `en` live and `ru`/`uz` scaffolded (message files are
en copies for now). No URL-prefix locale routing — a single-locale setup per the
"English-only at launch" decision.

## Card payment is a simple, non-charging form

Per explicit instruction overriding spec §16: a plain card-input form that is
**never** submitted to any processor and never charges. Card orders are marked
`paid`; COD orders are `cod_pending`. Both land on the confirmation page.

## Scope deferred this pass

Per instruction, this pass prioritizes a cleanly-installing, cleanly-building,
runnable app. Tests, Storybook, Playwright, and automated axe checks are **not**
included yet. Accessibility was handled by hand (labels, focus management, skip
link, alt text).

## No discount codes, no analytics, no reviews

Dropped from all UI per the §17 decisions. Wishlist is retained. Admin stats are
the only analytics (revenue MTD, orders-today by status, low stock, SMS
failures).
