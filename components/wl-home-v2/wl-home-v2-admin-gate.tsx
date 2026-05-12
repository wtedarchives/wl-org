"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useAdminStatus } from "@/hooks/use-admin-status"

/**
 * Admin-only gate for `/archive/admin`, `/archive/admin/radio`, and `/archive/bugs`.
 * Uses JWT {@link useAdminStatus} (same as {@link AdminGuard} / sidebar).
 */
export function WlHomeV2AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const { isAdmin } = useAdminStatus(session)

  useEffect(() => {
    if (authLoading) return
    if (!session || !isAdmin) {
      router.replace("/")
    }
  }, [session, isAdmin, authLoading, router])

  if (authLoading) {
    return <WlHomeV2PageLoading message="Verifying credentials…" />
  }

  if (!session || !isAdmin) {
    return null
  }

  return <>{children}</>
}
