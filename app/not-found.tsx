import type { Metadata } from "next"

import { NotFoundContent } from "@/components/not-found-content"
import { SiteShell } from "@/components/site-shell"
import { WlHomeV2 } from "@/components/wl-home-v2"

export const metadata: Metadata = {
  title: { absolute: "Page not found — WTEDRadio.com" },
}

export default function NotFound() {
  return (
    <SiteShell>
      <WlHomeV2>
        <NotFoundContent />
      </WlHomeV2>
    </SiteShell>
  )
}
