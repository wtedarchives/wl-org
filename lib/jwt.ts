// lib/jwt.ts
//
// WYSTERIA LANE — JWT Utility Library
// Client-side helpers for storing, reading, and clearing the custom
// session JWT issued by the sso-callback Edge Function.
//
// The JWT is stored in localStorage under the key "wl_session".
// It contains the following claims:
//   - profile_id      (uuid)
//   - discourse_user_id (integer)
//   - username        (string)
//   - email           (string)
//   - display_name    (string | null)
//   - avatar_url      (string | null)
//   - is_admin        (boolean)
//   - exp             (unix timestamp)
//   - iat             (unix timestamp)

const STORAGE_KEY = "wl_session";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WysteriaSession {
  profileId: string;
  discourseUserId: number;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  token: string;
  expiresAt: number;
}

interface JWTClaims {
  profile_id: string;
  discourse_user_id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  exp: number;
  iat: number;
}

// ─── Parse JWT (no verification — verification happens server-side) ───────────

function parseJWTClaims(token: string): JWTClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64url decode the payload
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(parts[1].length + ((4 - (parts[1].length % 4)) % 4), "=");

    const decoded = JSON.parse(atob(payload));
    return decoded as JWTClaims;
  } catch {
    return null;
  }
}

// ─── Check if token is expired ────────────────────────────────────────────────

export function isTokenExpired(token: string): boolean {
  const claims = parseJWTClaims(token);
  if (!claims) return true;
  // Add a 30-second buffer to account for clock skew
  return Date.now() / 1000 > claims.exp - 30;
}

// ─── Build session object from token ─────────────────────────────────────────

export function tokenToSession(token: string): WysteriaSession | null {
  const claims = parseJWTClaims(token);
  if (!claims) return null;

  return {
    profileId: claims.profile_id,
    discourseUserId: claims.discourse_user_id,
    username: claims.username,
    email: claims.email,
    displayName: claims.display_name,
    avatarUrl: claims.avatar_url,
    isAdmin: claims.is_admin,
    token,
    expiresAt: claims.exp,
  };
}

// ─── Store token ──────────────────────────────────────────────────────────────

export function storeToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    console.error("Failed to store session token");
  }
}

// ─── Retrieve stored token ────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// ─── Clear stored token ───────────────────────────────────────────────────────

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.error("Failed to clear session token");
  }
}

// ─── Get current session (reads from localStorage) ───────────────────────────
// Returns null if no token exists or if the token is expired.

export function getSession(): WysteriaSession | null {
  const token = getStoredToken();
  if (!token) return null;
  if (isTokenExpired(token)) {
    clearStoredToken();
    return null;
  }
  const session = tokenToSession(token)
  return session
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export function clearSession(): void {
  clearStoredToken();
  // Also clear SSO-related sessionStorage items
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("sso_nonce");
    sessionStorage.removeItem("sso_return_to");
  }
}