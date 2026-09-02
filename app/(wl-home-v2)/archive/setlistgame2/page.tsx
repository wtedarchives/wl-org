import { Suspense } from "react"

import { ArchiveSetlistGameEchoRedirect } from "@/components/archive/archive-setlistgame-echo-redirect"

/** Legacy Setlist Game archive slug. Production also 301s via `public/_redirects` / `netlify.toml`. */
export default function ArchiveSetlistGame2RedirectPage() {
  return (
    <Suspense fallback={null}>
      <ArchiveSetlistGameEchoRedirect />
    </Suspense>
  )
}
