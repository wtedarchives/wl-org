/**
 * Browser Web Push helpers (client-only).
 * Service worker lives at /sw.js; VAPID public key from env.
 */

export type PushSupportState =
  | "unsupported"
  | "blocked"
  | "default"
  | "granted"

export type PushSubscriptionPayload = {
  endpoint: string
  p256dh: string
  auth: string
}

const SW_URL = "/sw.js"

export function getPushSupportState(): PushSupportState {
  if (typeof window === "undefined") return "unsupported"
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return "unsupported"
  }
  if (Notification.permission === "denied") return "blocked"
  if (Notification.permission === "granted") return "granted"
  return "default"
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = raw.charCodeAt(i)
  }
  return out
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null
  try {
    return await navigator.serviceWorker.register(SW_URL, { scope: "/" })
  } catch (err) {
    console.error("Service worker registration failed:", err)
    return null
  }
}

export async function subscribeToWebPush(): Promise<
  | { ok: true; subscription: PushSubscriptionPayload }
  | { ok: false; error: string }
> {
  const support = getPushSupportState()
  if (support === "unsupported") {
    return { ok: false, error: "Push notifications are not supported in this browser." }
  }
  if (support === "blocked") {
    return {
      ok: false,
      error: "Notifications are blocked. Enable them in your browser settings for this site.",
    }
  }

  let permission = Notification.permission
  if (permission === "default") {
    permission = await Notification.requestPermission()
  }
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission was not granted." }
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
  if (!publicKey) {
    return { ok: false, error: "Push is not configured on this site." }
  }

  const registration = await registerPushServiceWorker()
  if (!registration) {
    return { ok: false, error: "Could not register the notification service worker." }
  }

  await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })
    } catch (err) {
      console.error("Push subscribe failed:", err)
      return { ok: false, error: "Could not subscribe for push notifications." }
    }
  }

  const json = subscription.toJSON()
  const endpoint = json.endpoint
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth
  if (!endpoint || !p256dh || !auth) {
    return { ok: false, error: "Invalid push subscription from browser." }
  }

  return {
    ok: true,
    subscription: { endpoint, p256dh, auth },
  }
}

export async function unsubscribeFromWebPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return
  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_URL)
    const subscription = await registration?.pushManager.getSubscription()
    if (subscription) await subscription.unsubscribe()
  } catch (err) {
    console.warn("Push unsubscribe failed:", err)
  }
}
