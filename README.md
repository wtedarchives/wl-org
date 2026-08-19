# WTEDRadio.com (wl-org)

**WTEDRadio.com** is the unified web platform for [Wysteria Lane](https://community.wysterialane.org)—built by Goose fans, for Goose fans. It brings together three main experiences:

1. **WTED Goose Radio** — Internet streaming radio celebrating Goose and related projects (Vasudo, Great Blue, Orebolo, and more).
2. **Wysteria Lane Community** — Links and integration with the [Discourse forum](https://community.wysterialane.org) where fans gather.
3. **Setlist Archive** — A comprehensive Goose setlist archive (shows, songs, tours, stats, venues, discography, lists, Setlist Game, and user attendance stats).

The site is operated by **Wysteria Lane LLC**, a volunteer-run nonprofit effort. No one on the WTED team is paid for their work; proceeds from merch and support go toward station and community goals.

---

## What you can do on the site

### Homepage (`/`)

The current **Wysteria Lane v2** shell (`WlHomeV2`) is the main entry point:

- **Listen** — Embedded WTED Goose Radio player, schedule, song requests, and "now playing" info.
- **Community** — Featured topics from the Wysteria Lane Discourse forum.
- **Setlist Archive** — Quick access to the latest show setlist and the full archive hub.
- **Profile** — Signed-in users see attendance stats, bookend shows, and links to **My Stats**.

Modals on the homepage handle login, signup, password reset, radio schedule, tour schedule, "this day in history," and archive navigation without leaving the page.

### WTED Radio (`/radio/...`)

- **About** (`/radio`, `/radio/about`) — Mission, FAQ, and how the station works.
- **Episodes** (`/radio/episodes`) — Episode catalog and show pages.
- **GORPs** (`/radio/gorps`) — Goose Obsessed Radio Personalities and contributors.
- Legacy `/wted/...` URLs 301 to `/radio/...`.

### Setlist Archive (`/archive/...`)

Browse and search Goose shows and related data:

| Area | Path (examples) |
|------|-----------------|
| Archive hub | `/archive` |
| Years | `/archive/years?id={uuid}` |
| Tours | `/archive/tours?id={uuid}` |
| Per-show setlist | `/archive/setlist?id={uuid}` |
| Songs | `/archive/songs`, `/archive/song?id={uuid}` |
| Stats | `/archive/stats` |
| Personnel | `/archive/personnel`, `/archive/personnel?id={uuid}` |
| Venues | `/archive/venues`, `/archive/venue?id=...` |
| Discography | `/archive/discography`, `/archive/discography?id={uuid}` |
| Lists | `/archive/lists`, `/archive/lists?id={uuid}` |
| Setlist Game (existing UI) | `/setlistgame2`, per-show/tour via query params |
| Goose 101 | `/goose101` |
| Submit corrections | `/archive/submit` (or `?submit=1` on archive pages) |

**My Stats** (signed-in): `/archive/profile?tab={slug}` — tabs include overview, shows, songs, slots, personnel, and badges.

**Public user profiles**: `/user?id={uuid}&tab={slug}`.

Internal links use helper functions in `lib/*-archive-url.ts` and `lib/user-profile-url.ts` so URLs stay consistent with static export and Netlify redirects.

### Other

- **Support** — `/support`
- **Auth** — Sign-in/sign-up modals and `/auth/callback` for Supabase auth
- **Legacy UI** — Older `(main)` sidebar layout and `/old/...` routes remain during the v2 migration

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) |
| UI | React 19, [Tailwind CSS](https://tailwindcss.com) 4, [shadcn/ui](https://ui.shadcn.com) / Radix |
| Data | [Supabase](https://supabase.com) (Postgres + Auth) |
| Maps / charts | Leaflet, Recharts |
| Deploy | [Netlify](https://www.netlify.com) — **fully static** (`output: "export"`) |

There are **no** Next.js API routes, server actions, or middleware at runtime. Anything that needs secrets, rate limiting, or server-side HTTP calls runs in **Supabase Edge Functions** under `supabase/functions/`.

---

## Architecture (important for contributors)

### Static export

`next.config.ts` sets `output: "export"`. The built site is plain HTML/JS/CSS. Do not add:

- `app/api/` routes
- `"use server"` actions
- `middleware.ts`
- Server-only env vars in page components (they are not available in the browser)

### Data fetching

- **Client-side**: Most reads use the Supabase JS client with `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Build-time**: `generateStaticParams` on dynamic routes pre-renders known IDs at `next build`.
- **Runtime-only IDs** (e.g. user profiles): use **query parameters**, not `[userId]` route segments.
- **Server logic**: Call Edge Functions at `{NEXT_PUBLIC_SUPABASE_URL}/functions/v1/{function-name}` with the anon key (and user JWT when required).

### Layout groups

- `app/(wl-home-v2)/` — Current homepage shell, archive pages, WTED v2 pages, auth callback.
- `app/(main)/` — Legacy sidebar layout; many routes also exist under `/old/...`.

### Images

Remote `next/image` sources must use the `unoptimized` prop (no Next.js Image Optimization API in static export).

---

## Local development

### Prerequisites

- Node.js 20+
- npm (or pnpm/yarn)
- Supabase project with schema and Edge Functions deployed (for full functionality)

### Environment variables

Create `.env.local` in the repo root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are required for local dev and for `next build` (static params and redirects).

### Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to out/ — run before merging significant changes
npm run lint
```

### Supabase Edge Functions

After changing anything under `supabase/functions/`:

```bash
supabase link --project-ref <your-project-ref>   # if not already linked
supabase functions deploy <function-folder-name>
```

Example: `supabase functions deploy dpro-admin`

The Netlify deploy does **not** deploy Edge Functions; use the Supabase CLI or Dashboard.

---

## Project structure (high level)

```
app/
  (wl-home-v2)/     # Current site: home, /archive/*, /radio/*, /user, auth
  (main)/           # Legacy layout + /old/* mirrors
components/
  wl-home-v2/       # Homepage shell, header, tiles, modals
  dpro/             # Setlist archive UI
  wted/             # Radio-related UI
lib/                # URL helpers, Supabase utilities, stats, etc.
supabase/functions/ # Edge Functions (admin, radio, SSO, game, etc.)
public/_redirects   # Netlify redirects (canonical URLs, profile paths)
```

---

## Deployment

The production app is a static export published to Netlify. Build settings should run `npm run build` and publish the `out/` directory. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Netlify build environment.

URL normalization (e.g. `/archive/user` → `/user`, profile tab paths) is handled in `public/_redirects`.

---

## Related links

- **Live site**: [WTEDRadio.com](https://wtedradio.com) (and Netlify preview: [wted-org.netlify.app](https://wted-org.netlify.app))
- **Community**: [community.wysterialane.org](https://community.wysterialane.org)
- **Support**: `/support` on this site

---

## License / contributions

This repository is private (`"private": true` in `package.json`). Contribution and licensing terms are determined by the Wysteria Lane maintainers—coordinate with the project owners before distributing or reusing code.
