// lib/sso.ts
//
// WYSTERIA LANE — SSO Initiation Helper
// Constructs the WLC DiscourseConnect redirect URL for login/signup.
// Called by the Sign In button and Sign Up button — both use the same URL.
//
// Uses Discourse as an IDENTITY PROVIDER (sso_provider) — NOT DiscourseConnect
// consumer mode. This means WLC keeps its native login form intact and forum
// users are completely unaffected.
//
// Local dev: when NEXT_PUBLIC_SSO_CALLBACK_URL is unset, localhost / 127.0.0.1
// uses `${origin}/auth/callback` so SSO returns to your dev server. Discourse
// must allow that return URL (forum SSO / trusted redirect settings).
//
// Discourse docs: https://meta.discourse.org/t/32974

const WLC_BASE_URL = "https://community.wysterialane.org";
const DEFAULT_PROD_CALLBACK_URL =
  "https://wted-org.netlify.app/auth/callback";

/** Where Discourse redirects after login (`return_sso_url` in the SSO payload). */
function resolveSsoCallbackUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SSO_CALLBACK_URL?.trim();
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${origin}/auth/callback`;
    }
  }

  return DEFAULT_PROD_CALLBACK_URL;
}

// ─── Generate a random nonce ──────────────────────────────────────────────────

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── HMAC-SHA256 sign the payload ─────────────────────────────────────────────
// WLC verifies this signature to confirm the request came from us.

async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Silent SSO attempt flag (localStorage — shared across tabs) ───────────────

const SSO_SILENT_ATTEMPTED_KEY = "sso_silent_attempted";

export function hasSilentAttempted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SSO_SILENT_ATTEMPTED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSilentAttempted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SSO_SILENT_ATTEMPTED_KEY, "1");
  } catch {
    console.error("Failed to mark silent SSO attempt");
  }
}

export function clearSilentAttempted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SSO_SILENT_ATTEMPTED_KEY);
  } catch {
    console.error("Failed to clear silent SSO attempt flag");
  }
}

const SSO_LOGOUT_FLOW_KEY = "sso_logout_flow";

/** Set before redirecting to WLC with logout=true so callback can distinguish sign-out. */
export function markLogoutFlow(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SSO_LOGOUT_FLOW_KEY, "1");
  } catch {
    console.error("Failed to mark SSO logout flow");
  }
}

export function consumeLogoutFlow(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const was = sessionStorage.getItem(SSO_LOGOUT_FLOW_KEY) === "1";
    sessionStorage.removeItem(SSO_LOGOUT_FLOW_KEY);
    return was;
  } catch {
    return false;
  }
}

/** Decode the base64 SSO payload WLC returns on the callback URL. */
export function decodeSsoPayload(sso: string): URLSearchParams | null {
  try {
    return new URLSearchParams(atob(sso));
  } catch {
    return null;
  }
}

/** WLC signals no session via failed=true inside the signed sso payload (not always a top-level param). */
export function isSsoFailedPayload(sso: string): boolean {
  return decodeSsoPayload(sso)?.get("failed") === "true";
}

// ─── Build the SSO redirect URL ───────────────────────────────────────────────

export type SSORedirectOptions = {
  promptNone?: boolean;
  logout?: boolean;
};

export async function buildSSORedirectURL(
  returnTo?: string,
  options?: SSORedirectOptions,
): Promise<string> {
  const secret = process.env.NEXT_PUBLIC_WLC_SSO_SECRET;
  if (!secret) {
    throw new Error("NEXT_PUBLIC_WLC_SSO_SECRET is not set");
  }

  const nonce = generateNonce();
  const callbackUrl = resolveSsoCallbackUrl();

  // Store nonce and intended destination in sessionStorage
  // so the callback route can verify and redirect correctly
  if (typeof window !== "undefined") {
    sessionStorage.setItem("sso_nonce", nonce);
    sessionStorage.setItem("sso_return_to", returnTo ?? window.location.pathname);
  }

  // Build the payload: nonce + return URL (+ optional prompt=none / logout)
  const payloadParams = new URLSearchParams({
    nonce,
    return_sso_url: callbackUrl,
  });
  if (options?.promptNone) {
    payloadParams.set("prompt", "none");
  }
  if (options?.logout) {
    payloadParams.set("logout", "true");
    markLogoutFlow();
  }
  const rawPayload = payloadParams.toString();

  // Base64 encode it
  const ssoPayload = btoa(rawPayload);

  // URL encode it
  const urlEncodedPayload = encodeURIComponent(ssoPayload);

  // Sign it
  const sig = await signPayload(ssoPayload, secret);

  // Use /session/sso_provider — Discourse as identity provider mode.
  // This keeps WLC native login intact for forum users.
  return `${WLC_BASE_URL}/session/sso_provider?sso=${urlEncodedPayload}&sig=${sig}`;
}

// ─── Redirect to WLC for login ────────────────────────────────────────────────

export async function redirectToLogin(
  returnTo?: string,
  options?: SSORedirectOptions,
): Promise<void> {
  if (!options?.promptNone && !options?.logout) {
    clearSilentAttempted();
  }
  const url = await buildSSORedirectURL(returnTo, options);
  window.location.href = url;
}