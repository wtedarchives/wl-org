import { Suspense } from "react"

import { ArchiveSetlistGameEchoRedirect } from "@/components/archive/archive-setlistgame-echo-redirect"

/** Legacy rebuild slug. Production also 301s via `public/_redirects` / `netlify.toml`. */
export default function ArchiveSetlistGameRedirectPage() {
  return (
    <Suspense fallback={null}>
      <ArchiveSetlistGameEchoRedirect />
    </Suspense>
  )
}
