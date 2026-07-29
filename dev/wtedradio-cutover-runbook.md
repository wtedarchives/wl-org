# WTEDRadio.com domain cutover runbook

**Target window:** ~9PM ET, Tuesday 7/28 (notional)  
**Primary domain:** `wtedradio.com` (apex)  
**`www`:** redirect → `https://wtedradio.com`  
**Old host (keep as rollback):** `https://wted-org.netlify.app`

This doc covers **code flips already staged in the repo**, **edge function deploys**, **external config**, and **smoke checks**. DNS / Community header / launch comms are Corey’s (and Shawna’s) lanes unless noted.

---

## Order of operations (recommended)

1. **Before DNS** — External allowlists ready (SSO callback, Supabase Auth redirects, optional env vars). Do **not** break the Netlify host yet.
2. **Flip code** — Comment out old hosts, uncomment `wtedradio.com` lines (see § Code flips).
3. **Deploy static site** — Netlify build/publish so `wtedradio.com` (once pointed) serves the new build. Umami is already gated to production hostnames.
4. **Deploy edge functions** — See § Edge function deploys.
5. **DNS** — Corey attaches `wtedradio.com` / updates records; `www` → apex.
6. **Community header** — Corey swaps Discourse theme script to `https://wtedradio.com/embed/wl-header.js` (after site + `WTED_BASE` flip are live).
7. **DNS spreadsheet** — Corey & Brian walk other domains.
8. **Smoke test** — § Verification.
9. **Next morning (~9AM ET 7/29)** — Announcements / push / social (Corey / Shawna).

---

## Code flips (repo)

Search for `Cutover` or `pre-cutover` in these files. For each: **comment out the live/old line(s), uncomment the wtedradio.com line(s).**

### 1. SSO default callback — `lib/sso.ts`

```ts
// BEFORE (live pre-cutover)
const DEFAULT_PROD_CALLBACK_URL =
  "https://wted-org.netlify.app/auth/callback";
// const DEFAULT_PROD_CALLBACK_URL =
//   "https://wtedradio.com/auth/callback";

// AFTER
// const DEFAULT_PROD_CALLBACK_URL =
//   "https://wted-org.netlify.app/auth/callback";
const DEFAULT_PROD_CALLBACK_URL =
  "https://wtedradio.com/auth/callback";
```

If Netlify has `NEXT_PUBLIC_SSO_CALLBACK_URL` set, update that env too (see § External).

### 2. Community embed — `public/embed/wl-header.js`

`WTED_BASE` / radio iframe already point at `wtedradio.com`. Flip **asset** host:

```js
// BEFORE
var ASSET_BASE = "https://wted-org.netlify.app";

// AFTER
var ASSET_BASE = "https://wtedradio.com";
```

Optional preview file: `dev/wl-header-preview.html` (script `src` → `wtedradio.com`).

### 3. TV pairing QR base — `supabase/functions/tv-pair-start/index.ts`

```ts
// BEFORE
const DEFAULT_BASE_URL = "https://wted-org.netlify.app"
// const DEFAULT_BASE_URL = "https://wtedradio.com"

// AFTER
// const DEFAULT_BASE_URL = "https://wted-org.netlify.app"
const DEFAULT_BASE_URL = "https://wtedradio.com"
```

If Supabase secret `TV_LOGIN_BASE_URL` is set, update it to `https://wtedradio.com` as well.

### 4. Setlist absolute URLs (chat / push) — `supabase/functions/_shared/discourse-brains-chat.ts`

```ts
// BEFORE
return `https://dripfield.pro/setlist/${id}`
// return `https://wtedradio.com/archive/setlist?id=${id}`

// AFTER
// return `https://dripfield.pro/setlist/${id}`
return `https://wtedradio.com/archive/setlist?id=${id}`
```

### Already done (no flip needed)

- **Umami** — `components/umami-analytics.tsx` loads only on `wtedradio.com` / `www.wtedradio.com`. Ships with the static site; no comment swap.

---

## Edge function deploys

Static Netlify deploy does **not** update Edge Functions. From the repo root (after linking if needed: `supabase link --project-ref <ref>`):

```bash
supabase functions deploy tv-pair-start
supabase functions deploy dpro-admin
supabase functions deploy setlist-game-reminders
```

- `tv-pair-start` — `DEFAULT_BASE_URL` / TV login QR origin  
- `dpro-admin` + `setlist-game-reminders` — pull in `_shared/discourse-brains-chat.ts` (setlist absolute URLs)

---

## External checklist (not in this repo)

Do these in Supabase / Netlify / Discourse / DNS tools. Prefer **add new allowlists before removing old**, so Netlify still works during propagation.

| # | Where | Action |
|---|--------|--------|
| 1 | **Netlify** | Attach custom domain `wtedradio.com`; SSL; apex per Netlify docs (`apex-loadbalancer.netlify.com` / their current apex instructions). |
| 2 | **DNS (registrar)** | Apex + `www` as planned; **`www` → `wtedradio.com`**. Remove/replace old A/CNAME for the previous host once Netlify is ready. |
| 3 | **DNS spreadsheet** | Other domains → new site (Corey & Brian). |
| 4 | **Netlify env** | If set: `NEXT_PUBLIC_SSO_CALLBACK_URL=https://wtedradio.com/auth/callback` → trigger rebuild. |
| 5 | **Supabase Edge secrets** | If set: `TV_LOGIN_BASE_URL=https://wtedradio.com`. |
| 6 | **Supabase Auth → URL configuration** | Allow `https://wtedradio.com/**` and `https://wtedradio.com/auth/callback`. Keep Netlify URLs briefly for rollback. |
| 7 | **Discourse SSO / trusted return URLs** | Allow `https://wtedradio.com/auth/callback` (same place Netlify callback is allowed today). |
| 8 | **Discourse theme (Community header)** | Save old header snippet first. Point script at `https://wtedradio.com/embed/wl-header.js` (after code flip + site deploy). |
| 9 | **Mobile / push / social / email** | Campaign + 9AM ET 7/29 links → `wtedradio.com` (Corey / Shawna). |

CORS on Edge Functions is already `*`; no origin flip required there.

---

## Verification (after DNS + deploys)

- [ ] `https://wtedradio.com` loads; HTTPS OK.
- [ ] `https://www.wtedradio.com` redirects to apex.
- [ ] Sign in / SSO round-trips to `/auth/callback` on `wtedradio.com`.
- [ ] Community header loads images/links from `wtedradio.com` (not Netlify).
- [ ] Archive / setlist / radio player basics work.
- [ ] TV pair QR (if used) points at `https://wtedradio.com/tv-login…`.
- [ ] New Discourse/push setlist links use `/archive/setlist?id=…` on `wtedradio.com`.
- [ ] Umami: open `wtedradio.com`, confirm a pageview; `wted-org.netlify.app` should **not** send (hostname gate).
- [ ] Spot-check one or two spreadsheet redirects.

---

## Rollback (if needed)

1. Revert code flips (Netlify / dripfield lines live again) + redeploy site + edge functions above.
2. Point DNS / Discourse header back to `wted-org.netlify.app` if required.
3. Leave Supabase/Discourse allowlists for both hosts until stable.

---

## Owners (from launch sequence)

| Area | Owner |
|------|--------|
| Netlify domain + DNS for `wtedradio.com` / `www` | Corey |
| Other domain redirects (spreadsheet) | Corey & Brian |
| Community header | Corey |
| Code flips + edge deploys + Umami verify | Brian |
| Mobile campaign / push / Community announcement / email | Corey |
| Social posts | Shawna |

---

## Quick file index

| File | What to flip |
|------|----------------|
| `lib/sso.ts` | Default SSO callback URL |
| `public/embed/wl-header.js` | `ASSET_BASE` (nav/radio already on `wtedradio.com`) |
| `supabase/functions/tv-pair-start/index.ts` | `DEFAULT_BASE_URL` |
| `supabase/functions/_shared/discourse-brains-chat.ts` | Absolute setlist URL |
| `dev/wl-header-preview.html` | Preview script src (optional) |
| `components/umami-analytics.tsx` | Already live for prod hosts only |
