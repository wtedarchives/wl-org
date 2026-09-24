import { Providers } from "@/components/providers"

/**
 * Same auth stack as the rest of the site (SSO session in AuthProvider).
 * Stays outside `(wl-home-v2)` so the page does not render the site header,
 * footer, or in-app radio.
 */
export default function VoteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Providers>{children}</Providers>
}
