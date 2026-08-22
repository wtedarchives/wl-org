import type { ReactNode } from "react"

import "@/components/wted/ios-radio/ios-radio-embed.css"

/**
 * Strip `?_=` (and any other query) before Next hydrates. A cache-busted
 * iframe URL makes the static App Router treat this as a client 404 and
 * mount the full WlHomeV2 not-found header inside Community `<wl-header>`.
 */
const STRIP_EMBED_SEARCH =
  "if(location.search)history.replaceState(null,\"\",location.pathname+location.hash)"

export default function EmbedRadioLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: STRIP_EMBED_SEARCH }} />
      {children}
    </>
  )
}
