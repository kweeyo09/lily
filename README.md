# KIXIZZ STUDIO

Portfolio site for [kixizz.com](https://kixizz.com).

## Stack

- **Client** — React 19 + Vite + Tailwind 4 + wouter, Three.js for the 3D flowers
- **Server** — Express + tRPC + Drizzle (MySQL). Not used by any routed page; kept for future features.

## Local development

```bash
pnpm install
pnpm dev      # Express + Vite middleware on http://localhost:3000
```

To work on the client alone, without the server:

```bash
pnpm exec vite
```

Copy `.env.example` to `.env` if you plan to run the server with auth or a database.

## Build

```bash
pnpm exec vite build   # static client -> dist/public
pnpm build             # client + server bundle -> dist/
```

## Deploying to kixizz.com

The portfolio is fully static — every route renders client-side and no page calls the
API. `vercel.json` is set up for a static Vercel deployment:

- build: `vite build`
- output: `dist/public`
- SPA rewrite so every route falls through to `index.html`

### DNS

Point the domain at Vercel, then add both `kixizz.com` and `www.kixizz.com` in the
project's Domains settings so Vercel issues certificates and redirects www to the apex.

| Record | Name  | Value                   |
| ------ | ----- | ----------------------- |
| A      | `@`   | `76.76.21.21`           |
| CNAME  | `www` | `cname.vercel-dns.com.` |

Confirm the current values in the Vercel dashboard before saving — Vercel changes them
occasionally.

### If you later need the API

The static deployment does not run `server/`. To serve the tRPC API you need a Node
host (Railway, Fly.io, Render, or a Vercel Node function): run `pnpm build`, then
`pnpm start`, and set the env vars from `.env.example`.

## Notes

- Auth is a first-party JWT session (`server/_core/session.ts`). No identity provider is
  wired up — add one and call `db.upsertUser` + `session.signSession` to issue a cookie.
- Static media lives in `client/public/assets/` and is served from `/assets/`.
