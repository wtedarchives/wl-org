#!/usr/bin/env node
/**
 * Mint a REAL, correctly signed Wysteria session token for local testing.
 *
 * Why this exists: the dev bar in `components/dev-auth-mock-bar.tsx` builds a token
 * with a placeholder signature. That is fine for UI keyed on `useAuth`, but every
 * Edge Function calls `jwtVerify` and rejects it — so nothing that reads or writes
 * through `dpro-admin` works under a mock session. wted-brains reads its
 * assignments through `brains_my_assignments`, which makes the mock useless for
 * testing the setlister path specifically.
 *
 * This signs with the same HS256 secret `sso-callback` uses, producing a token
 * indistinguishable from a real login. Every authorization check then runs for
 * real, which is the point: you are testing the window and assignment logic, not a
 * bypass of it.
 *
 * Usage:
 *   node scripts/dev-mint-session.mjs wted-brains
 *   node scripts/dev-mint-session.mjs watsonbriant --hours 2
 *
 * Requires WYSTERIA_JWT_SECRET in .env.local (or the environment). Copy it from the
 * Supabase dashboard → Edge Functions → Secrets. It is read here only; never add it
 * to a NEXT_PUBLIC_ variable, which would inline it into the browser bundle.
 */

import { createHmac } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

/** Mirrors DEV_AUTH_MOCK_PROFILES in lib/dev-auth-mock.ts. */
const PROFILES = {
  watsonbriant: {
    profile_id: "75f1ef5d-6b9a-4064-9b21-8b8550dc34bc",
    discourse_user_id: 1119,
    username: "watsonbriant",
    email: "watson.briant@gmail.com",
    display_name: "Brian Watson (dripfield.pro)",
    avatar_url: null,
    is_admin: true,
  },
  "wted-brains": {
    profile_id: "e8e37a1d-14d9-4f06-b792-4bcf10bed319",
    discourse_user_id: 0,
    username: "wted-brains",
    email: "wted-brains@wtedradio.com",
    display_name: "wted-brains",
    avatar_url: null,
    // Non-admin on purpose: an admin token skips every window check.
    is_admin: false,
  },
}

function loadSecret() {
  if (process.env.WYSTERIA_JWT_SECRET) return process.env.WYSTERIA_JWT_SECRET
  try {
    const env = readFileSync(resolve(ROOT, ".env.local"), "utf8")
    for (const line of env.split("\n")) {
      const m = line.match(/^\s*WYSTERIA_JWT_SECRET\s*=\s*(.*)\s*$/)
      if (m) return m[1].replace(/^["']|["']$/g, "").trim()
    }
  } catch {
    // .env.local missing is a normal state; fall through to the error below.
  }
  return null
}

function base64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function sign(claims, secret) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const payload = base64url(JSON.stringify(claims))
  const data = `${header}.${payload}`
  const sig = base64url(createHmac("sha256", secret).update(data).digest())
  return `${data}.${sig}`
}

const [, , profileArg, ...rest] = process.argv
const names = Object.keys(PROFILES).join(", ")

if (!profileArg || !PROFILES[profileArg]) {
  console.error(
    `Usage: node scripts/dev-mint-session.mjs <${names}> [--hours N]\n`,
  )
  process.exit(1)
}

const hoursIdx = rest.indexOf("--hours")
const hours = hoursIdx >= 0 ? Number(rest[hoursIdx + 1]) : 12
if (!Number.isFinite(hours) || hours <= 0) {
  console.error("--hours must be a positive number")
  process.exit(1)
}

const secret = loadSecret()
if (!secret) {
  console.error(
    "WYSTERIA_JWT_SECRET not found.\n\n" +
      "Add it to .env.local (server-side only — never as NEXT_PUBLIC_*):\n" +
      "  WYSTERIA_JWT_SECRET=<value from Supabase → Edge Functions → Secrets>\n",
  )
  process.exit(1)
}

const now = Math.floor(Date.now() / 1000)
const profile = PROFILES[profileArg]
const token = sign(
  { ...profile, iat: now, exp: now + Math.round(hours * 3600) },
  secret,
)

console.log(
  `\nSigned session for ${profile.username} (is_admin: ${profile.is_admin}), valid ${hours}h.\n\n` +
    `Paste this into the browser console on localhost, then reload:\n\n` +
    `  localStorage.setItem('wl_session', '${token}');\n` +
    `  localStorage.removeItem('wl_dev_auth_mock_active');\n` +
    `  location.reload();\n\n` +
    `Turn the dev bar to "Off" first, or it will overwrite this token.\n` +
    `To get back to your normal session, sign out in the app.\n`,
)
