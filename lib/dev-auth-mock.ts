/**
 * Local dev-only helpers to simulate a signed-in session without Discourse SSO.
 * Never active when `NODE_ENV !== "development"`.
 *
 * The browser JWT helpers only decode the payload (see `lib/jwt.ts`), which is
 * enough for Supabase reads keyed by `profile_id` and for UI that uses `useAuth`.
 *
 * IMPORTANT LIMIT: the token minted here carries a placeholder signature, so
 * `dpro-admin` and every other Edge Function rejects it — `jwtVerify` fails before
 * the action is even read. Anything that writes, and anything that reads through an
 * Edge Function (including wted-brains assignment lookups), will not work under a
 * mock session. Use `scripts/dev-mint-session.mjs` for a properly signed token when
 * you need to exercise the real authorization path.
 */

import {
  clearStoredToken,
  getStoredToken,
  notifySessionUpdated,
  storeToken,
} from "@/lib/jwt"

const STORAGE_MOCK_ACTIVE = "wl_dev_auth_mock_active"
const STORAGE_SESSION_BACKUP = "wl_dev_auth_session_backup"

export interface DevAuthMockProfile {
  profileId: string
  discourseUserId: number
  username: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  isAdmin: boolean
  /** Shown on the dev bar. */
  hint: string
}

/**
 * The accounts the dev bar can sign in as.
 *
 * `isAdmin` mirrors each profile's real `user_roles.is_admin` so the mock behaves
 * like the account it stands in for — that is the whole point of having a
 * non-admin option: an admin session skips every window check in wted-brains and
 * so cannot exercise the setlister path.
 */
export const DEV_AUTH_MOCK_PROFILES = {
  watsonbriant: {
    profileId: "75f1ef5d-6b9a-4064-9b21-8b8550dc34bc",
    discourseUserId: 1119,
    username: "watsonbriant",
    email: "watson.briant@gmail.com",
    displayName: "Brian Watson (dripfield.pro)",
    avatarUrl:
      "https://canada1.discourse-cdn.com/flex027/uploads/wysterialane/original/3X/7/b/7b3b60b566a16fbb744c14d4b8ae1a191565e145.jpeg",
    isAdmin: true,
    hint: "admin",
  },
  "wted-brains": {
    profileId: "e8e37a1d-14d9-4f06-b792-4bcf10bed319",
    discourseUserId: 0,
    username: "wted-brains",
    email: "wted-brains@wtedradio.com",
    displayName: "wted-brains",
    avatarUrl: null,
    isAdmin: false,
    hint: "setlister · non-admin",
  },
} as const satisfies Record<string, DevAuthMockProfile>

export type DevAuthMockProfileId = keyof typeof DEV_AUTH_MOCK_PROFILES

export const DEV_AUTH_MOCK_PROFILE_IDS = Object.keys(
  DEV_AUTH_MOCK_PROFILES,
) as DevAuthMockProfileId[]

/** @deprecated Prefer {@link DEV_AUTH_MOCK_PROFILES}; kept for existing imports. */
export const DEV_AUTH_MOCK_PROFILE = DEV_AUTH_MOCK_PROFILES.watsonbriant

function isDevRuntime(): boolean {
  return process.env.NODE_ENV === "development" && typeof window !== "undefined"
}

function base64UrlEncodeJson(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  let binary = ""
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** Minimal JWT shape; signature is not verified client-side. */
function buildDevMockJwt(profile: DevAuthMockProfile): string {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + 10 * 365 * 24 * 60 * 60
  const headers = base64UrlEncodeJson({ alg: "HS256", typ: "JWT" })
  const body = base64UrlEncodeJson({
    profile_id: profile.profileId,
    discourse_user_id: profile.discourseUserId,
    username: profile.username,
    email: profile.email,
    display_name: profile.displayName,
    avatar_url: profile.avatarUrl,
    is_admin: profile.isAdmin,
    wl_dev_mock: true,
    iat: now,
    exp,
  })
  const sig = "e30" // "{}", placeholder third segment
  return `${headers}.${body}.${sig}`
}

function readStoredProfileId(): DevAuthMockProfileId | null {
  if (!isDevRuntime()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_MOCK_ACTIVE)
    if (!raw) return null
    // "1" is the pre-multi-profile value, which always meant watsonbriant.
    if (raw === "1") return "watsonbriant"
    return raw in DEV_AUTH_MOCK_PROFILES
      ? (raw as DevAuthMockProfileId)
      : null
  } catch {
    return null
  }
}

/** Which account the dev bar is currently impersonating, if any. */
export function getActiveDevAuthMockProfileId(): DevAuthMockProfileId | null {
  return readStoredProfileId()
}

export function getActiveDevAuthMockProfile(): DevAuthMockProfile | null {
  const id = readStoredProfileId()
  return id ? DEV_AUTH_MOCK_PROFILES[id] : null
}

export function isDevAuthMockSessionActive(): boolean {
  return readStoredProfileId() !== null
}

/** @deprecated Use {@link notifySessionUpdated} from `@/lib/jwt`. */
export const notifySessionRefresh = notifySessionUpdated

/** Sign in as one of the dev profiles (backs up any real `wl_session` once). */
export function enableDevAuthMock(
  profileId: DevAuthMockProfileId = "watsonbriant",
): void {
  if (!isDevRuntime()) return
  const profile = DEV_AUTH_MOCK_PROFILES[profileId]
  if (!profile) return
  try {
    if (readStoredProfileId() === null) {
      const existing = getStoredToken()
      if (existing) {
        window.localStorage.setItem(STORAGE_SESSION_BACKUP, existing)
      } else {
        window.localStorage.removeItem(STORAGE_SESSION_BACKUP)
      }
    }
    storeToken(buildDevMockJwt(profile))
    window.localStorage.setItem(STORAGE_MOCK_ACTIVE, profileId)
    notifySessionRefresh()
  } catch {
    console.error("enableDevAuthMock failed")
  }
}

/** Remove mock session; restore previous token if we backed one up. */
export function disableDevAuthMock(): void {
  if (!isDevRuntime()) return
  try {
    clearStoredToken()
    const backup = window.localStorage.getItem(STORAGE_SESSION_BACKUP)
    if (backup) {
      storeToken(backup)
      window.localStorage.removeItem(STORAGE_SESSION_BACKUP)
    }
    window.localStorage.removeItem(STORAGE_MOCK_ACTIVE)
    notifySessionRefresh()
  } catch {
    console.error("disableDevAuthMock failed")
  }
}

/** Null signs out of the mock; a profile id switches to that account. */
export function setDevAuthMockProfile(
  profileId: DevAuthMockProfileId | null,
): void {
  if (profileId === null) disableDevAuthMock()
  else enableDevAuthMock(profileId)
}

/** @deprecated Use {@link setDevAuthMockProfile}. */
export function setDevAuthMockEnabled(enabled: boolean): void {
  setDevAuthMockProfile(enabled ? "watsonbriant" : null)
}
