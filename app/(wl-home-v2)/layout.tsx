import type { Metadata } from "next"

/**
 * Shell for the new homepage (`/`) and any future routes that share its IA.
 * Child pages use `title: "Page name"` → browser title `Page name — WysteriaLane.org`.
 * The index page overrides with `title.absolute` so the home tab is exactly `WysteriaLane.org`.
 */
export const metadata: Metadata = {
  title: {
    default: "WysteriaLane.org",
    template: "%s — WysteriaLane.org",
  },
}

export default function WlHomeV2RouteGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
