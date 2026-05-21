/**
 * Local dev-only helpers to simulate a signed-in session without Discourse SSO.
 * Never active when `NODE_ENV !== "development"`.
 *
 * The browser JWT helpers only decode the payload (see `lib/jwt.ts`); this is
 * enough for Supabase reads keyed by `profile_id` and for UI that uses `useAuth`.
 */

import {
  clearStoredToken,
  getStoredToken,
  notifySessionUpdated,
  storeToken,
} from "@/lib/jwt"

const STORAGE_MOCK_ACTIVE = "wl_dev_auth_mock_active"
const STORAGE_SESSION_BACKUP = "wl_dev_auth_session_backup"

export const DEV_AUTH_MOCK_PROFILE = {
  profileId: "75f1ef5d-6b9a-4064-9b21-8b8550dc34bc",
  discourseUserId: 1119,
  username: "watsonbriant",
  email: "watson.briant@gmail.com",
  displayName: "Brian Watson (dripfield.pro)",
  avatarUrl:
    "https://canada1.discourse-cdn.com/flex027/uploads/wysterialane/original/3X/7/b/7b3b60b566a16fbb744c14d4b8ae1a191565e145.jpeg",
  isAdmin: false,
} as const

function isDevRuntime(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined"
  )
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
function buildDevMockJwt(): string {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + 10 * 365 * 24 * 60 * 60
  const headers = base64UrlEncodeJson({ alg: "HS256", typ: "JWT" })
  const body = base64UrlEncodeJson({
    profile_id: DEV_AUTH_MOCK_PROFILE.profileId,
    discourse_user_id: DEV_AUTH_MOCK_PROFILE.discourseUserId,
    username: DEV_AUTH_MOCK_PROFILE.username,
    email: DEV_AUTH_MOCK_PROFILE.email,
    display_name: DEV_AUTH_MOCK_PROFILE.displayName,
    avatar_url: DEV_AUTH_MOCK_PROFILE.avatarUrl,
    is_admin: DEV_AUTH_MOCK_PROFILE.isAdmin,
    wl_dev_mock: true,
    iat: now,
    exp,
  })
  const sig = "e30" // "{}", placeholder third segment
  return `${headers}.${body}.${sig}`
}

export function isDevAuthMockSessionActive(): boolean {
  if (!isDevRuntime()) return false
  try {
    return window.localStorage.getItem(STORAGE_MOCK_ACTIVE) === "1"
  } catch {
    return false
  }
}

/** @deprecated Use {@link notifySessionUpdated} from `@/lib/jwt`. */
export const notifySessionRefresh = notifySessionUpdated

/** Turn on mock session (backs up any existing `wl_session` once). */
export function enableDevAuthMock(): void {
  if (!isDevRuntime()) return
  try {
    if (window.localStorage.getItem(STORAGE_MOCK_ACTIVE) !== "1") {
      const existing = getStoredToken()
      if (existing) {
        window.localStorage.setItem(STORAGE_SESSION_BACKUP, existing)
      } else {
        window.localStorage.removeItem(STORAGE_SESSION_BACKUP)
      }
    }
    storeToken(buildDevMockJwt())
    window.localStorage.setItem(STORAGE_MOCK_ACTIVE, "1")
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

export function setDevAuthMockEnabled(enabled: boolean): void {
  if (enabled) enableDevAuthMock()
  else disableDevAuthMock()
}
