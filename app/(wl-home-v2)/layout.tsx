import type { Metadata } from "next"

import { SiteShell } from "@/components/site-shell"

/**
 * Shell for the new homepage (`/`) and any future routes that share its IA.
 * Child pages use `title: "Page name"` → browser title `Page name — WTEDRadio.com`.
 * The index page overrides with `title.absolute` so the home tab is exactly `WTEDRadio.com`.
 *
 * Auth and the in-app radio live here — not on `/embed/radio`.
 */
export const metadata: Metadata = {
  title: {
    default: "WTEDRadio.com",
    template: "%s — WTEDRadio.com",
  },
}

export default function WlHomeV2RouteGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SiteShell>{children}</SiteShell>
}
