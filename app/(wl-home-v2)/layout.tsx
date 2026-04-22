import type { Metadata } from "next"

/**
 * Shell for the new homepage (`/`) and any future routes that share its IA.
 * Child pages use `title: "Page name"` → browser title `Page name — WTED.org`.
 * The index page overrides with `title.absolute` so the home tab is exactly `WTED.org`.
 */
export const metadata: Metadata = {
  title: {
    default: "WTED.org",
    template: "%s — WTED.org",
  },
}

export default function WlHomeV2RouteGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
