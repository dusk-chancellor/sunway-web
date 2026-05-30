# Sunway — E-commerce Frontend

A complete Next.js 15 frontend for **Sunway**, a general-retail online store with
local self-delivery and dual payment (card / cash on delivery). One codebase
serves both the **public storefront** and the **internal admin panel**.

The Go backend does not exist yet, so this repo ships with a **fully working
local API** implemented as Next.js Route Handlers backed by an in-memory store.
You can run, click through, and demo the entire app with a single command — no
external services, no database, no mock-service-worker.

---

## Quick start

Requirements: **Node 20+** (tested on Node 22) and **pnpm 9+**.

```bash
corepack enable          # makes pnpm available if it isn't already
pnpm install
cp .env.example .env.local   # already included; edit if needed
pnpm dev                 # http://localhost:3000
```

That's it. The storefront is at `/`, the admin panel at `/admin`.

### Production build

```bash
pnpm build
pnpm start
```

---

## Demo credentials & auth

Authentication is **OTP over SMS** (phone only — no passwords, no email).
In development there is **no real SMS provider**: the verification code is
printed to the **server console** (the terminal running `pnpm dev`), and the
dev code **`000000`** is always accepted.

- **Customer:** enter any valid Uzbek phone (e.g. `+998901234567`) on `/login`,
  then use code `000000`.
- **Admin (sales manager):** go to `/admin/login`. The phone is pre-filled with
  the seeded manager number **`+998901112233`**; use code `000000`.

---

## Scripts

| Script            | What it does                                  |
| ----------------- | --------------------------------------------- |
| `pnpm dev`        | Dev server (storefront + admin + local API)   |
| `pnpm build`      | Production build                              |
| `pnpm start`      | Serve the production build                    |
| `pnpm lint`       | ESLint                                         |
| `pnpm typecheck`  | `tsc --noEmit` (strict)                        |

---

## Project layout

```
app/
  (shop)/            Storefront routes (home, category, product, cart, checkout,
                     account, orders, legal pages)
  admin/             Admin panel: /admin/login + /admin/(dashboard)/*
  api/v1/            Local API (34 route handlers) — the stand-in backend
src/
  components/        ui/ primitives, shared/, storefront/, admin/
  lib/
    api/             client (apiFetch), resources/ (typed fetchers), hooks/
    validation/      Zod schemas — the single source of truth for all types
    format/          money / phone / date helpers
  server/            In-memory store, seed data, HTTP helpers (the backend)
  i18n/              next-intl config + messages (en live; ru/uz scaffolded)
  styles/            globals.css with the brand design tokens (Tailwind v4)
middleware.ts        Route gating for /checkout, /account/*, /admin/*
```

---

## Pointing at the real Go backend later

Every client request goes through `apiFetch` in `src/lib/api/client.ts`, which
prefixes paths with `NEXT_PUBLIC_API_URL` (default `/api/v1`). When the Go
backend is ready:

1. Set `NEXT_PUBLIC_API_URL=https://api.sunway.example/v1` in `.env.local`.
2. Delete `app/api/v1/` and `src/server/` (or leave them — they're only used
   when requests hit the local prefix).

No component or hook changes are required: the wire contract (paths, JSON
shapes, money-as-string, cookie names) is documented in `DECISIONS.md` and
enforced by the Zod schemas, so the Go service just has to match it.

---

## Key conventions

- **Money** is integer minor units (tiyin) end-to-end, sent on the wire as a
  **string** (bigint-safe) and only formatted for display via `<Money>`.
- **No `any` / `@ts-ignore`** — ESLint treats `no-explicit-any` as an error.
- **No reviews/ratings** anywhere (wishlist is kept).
- **SSR** for SEO-critical routes (home, category, product, legal); client
  components fetch via TanStack Query.
- **Accessibility**: labelled inputs, focus rings, modal focus trapping, skip
  link, alt text.

See `DECISIONS.md` for the full rationale and every deliberate deviation from
the original spec.
