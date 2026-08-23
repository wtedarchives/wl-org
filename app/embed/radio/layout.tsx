import type { ReactNode } from "react"

import "@/components/wted/ios-radio/ios-radio-embed.css"

/**
 * Public player document for Community `<wl-header>`.
 * No SiteShell / AuthProvider — those live on `(wl-home-v2)` only.
 */
export default function EmbedRadioLayout({ children }: { children: ReactNode }) {
  return children
}
