/* WTED live setlist Web Push — static service worker (Netlify /public). */

self.addEventListener("push", (event) => {
  let payload = { title: "WTED", body: "", url: "/" }
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() }
    }
  } catch {
    // ignore malformed payload
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/WL.png",
      badge: "/WL.png",
      tag: "wted-setlist-live",
      data: { url: payload.url },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url
  if (!targetUrl || typeof targetUrl !== "string") return

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    }),
  )
})
