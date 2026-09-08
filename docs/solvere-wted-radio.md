# Solvere — Project 01 fill-in (WTED Radio)

Copy these fields into [solvere.build/work/01](https://solvere.build/work/01).

The repo is the unified **WTEDRadio.com** site (radio + community + setlist archive), not a standalone player.

---

## Identity / URL

| Field | Value |
|---|---|
| **Slug / number** | `01` |
| **Page title** | Project 01 — Solvere |
| **Eyebrow** | project 01 |
| **Live URL** | https://wtedradio.com |

---

## Hero

**Project name**

WTEDRadio.com

**One-liner**

A fan-run site for Goose listeners: stream WTED Goose Radio, follow the Wysteria Lane community, and browse a full setlist archive.

---

## Metadata strip

| Field | Value |
|---|---|
| **Client** | Wysteria Lane LLC (volunteer-run; WTED Goose Radio) |
| **Year** | 2026 |
| **Role** | design and build |
| **Status** | in production |

---

## What was built

The public site is one Next.js app at [WTEDRadio.com](https://wtedradio.com). The homepage is a single shell: listen (player, schedule, song requests, now playing), community (featured Discourse topics), setlist archive (latest show and the full hub), and a signed-in profile with attendance and stats. Radio pages cover about/FAQ, episodes, and GORPs. The archive covers years, tours, per-show setlists, songs, stats, personnel, venues, discography, lists, Echo / Setlist Game, Goose 101, correction submit, and public user profiles.

The constraint that shaped the rest of it: the app is a **static export** on Netlify (`output: "export"`). There are no Next.js API routes, server actions, or middleware at runtime. Reads go to Supabase from the browser with the anon key. Anything that needs secrets, rate limits, or outbound HTTP (Radio.co, Discourse SSO, song requests, admin writes, search, push, share images) lives in Supabase Edge Functions.

---

## The pieces

1. Homepage shell — listen, community, archive, profile, and the radio/schedule/auth modals
2. Admin / back-office — setlist, shows, songs, venues, discography, radio playlists, Bandcamp, and related tabs
3. Integrations — Radio.co streaming, Discourse forum + SSO, Bandcamp, Stripe support, iOS/Android apps
4. Permissions and audit — Supabase sessions, DiscourseConnect SSO, role-based admin, attendance and public profiles

---

## Screens

| Slot | Aspect | What to capture |
|---|---|---|
| **Main screen** | 16:9 | Homepage: [wtedradio.com](https://wtedradio.com) with the listen / community / archive tiles |
| **Secondary screen** | 4:3 | A show setlist (`/archive/setlist?id=…`) or `/archive` |
| **Detail / mobile** | 4:3 | Phone homepage or `/radio/about` |

---

## Stack & architecture notes

It ships as static HTML/JS/CSS. The tradeoff was no Next server at request time: cheaper and simpler to host, but every privileged action has to be an Edge Function, and user-specific pages use query params (`/user?id=`) because IDs are not known at build time.

### `$ cat stack.txt`

```
frontend    typescript · react · next.js
backend     supabase edge functions
data        postgres (supabase)
auth        supabase session · discourse sso · role-based
hosting     netlify (static export)
```

### `$ notes`

1. Static export plus Edge Functions is the decision that kept secrets and licensing/API calls off the static host.
2. I would retire the leftover `(main)` / `/old` layout sooner; carrying two shells made every new page a routing and URL-canonicalization problem.

---

## Work index card (`/work`)

| Field | Value |
|---|---|
| **Name** | WTEDRadio.com |
| **Summary** | Fan site for Goose: radio, community, and setlist archive. |
| **Stack** | Next.js · Supabase · Netlify |
| **Year** | 2026 |
| **Role** | design and build |
