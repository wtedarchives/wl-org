"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useBrainsAccess } from "@/hooks/use-brains-access"

/**
 * Gate for `/archive/brains`. Admins always pass; everyone else needs a live
 * assignment, which `useBrainsAccess` resolves against the server clock.
 *
 * This is a convenience, not a security boundary. The site is a static export, so
 * there is no middleware, and `parseJWTClaims` reads the token without verifying
 * it — a forged localStorage token can render this page. What it cannot do is
 * write: `dpro-admin` verifies the signature and re-checks the assignment on
 * every mutation. Nothing sensitive to merely LOOK at belongs on this page.
 */
export function BrainsGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { loading, hasAccess } = useBrainsAccess()

  useEffect(() => {
    if (loading) return
    if (!hasAccess) router.replace("/")
  }, [loading, hasAccess, router])

  if (loading) {
    return <WlHomeV2PageLoading message="Checking your access…" />
  }

  if (!hasAccess) return null

  return <>{children}</>
}
