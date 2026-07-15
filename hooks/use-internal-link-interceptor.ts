"use client"

import { useCallback, type MouseEvent as ReactMouseEvent } from "react"
import { useRouter } from "next/navigation"

/**
 * Returns a delegated `onClick` handler for a container that renders
 * admin-authored HTML (coach notes, show notes, callbacks) via
 * `dangerouslySetInnerHTML`. That HTML contains plain `<a href>` tags, which —
 * under `output: "export"` — would trigger a full-document reload, tearing down
 * `document.body` and remounting (restarting) the persistent radio iframe.
 *
 * This handler routes same-origin links through the Next.js router instead, so
 * navigation stays client-side and playback is preserved. New-tab / modified /
 * external / download / in-page-hash clicks are left to the browser.
 */
export function useInternalLinkInterceptor() {
  const router = useRouter()

  return useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      // Let the browser handle new-tab / non-primary interactions.
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }

      const anchor = (e.target as HTMLElement | null)?.closest("a")
      if (!anchor) return

      // Explicit new-tab / download / non-navigational anchors: leave alone.
      const target = anchor.getAttribute("target")
      if ((target && target !== "_self") || anchor.hasAttribute("download")) {
        return
      }

      const href = anchor.getAttribute("href")
      if (!href) return

      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }

      // External links: let the browser navigate normally.
      if (url.origin !== window.location.origin) return

      // Pure in-page hash on the current route: let the browser scroll.
      if (
        url.hash &&
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return
      }

      e.preventDefault()
      router.push(url.pathname + url.search + url.hash)
    },
    [router],
  )
}
