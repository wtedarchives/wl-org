"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useAdminStatus } from "@/hooks/use-admin-status"

const DEV_BYPASS_ADMIN_GATE = process.env.NODE_ENV === "development"

/**
 * Admin-only gate for `/archive/admin`, `/archive/admin/radio`, and `/archive/bugs`.
 * Uses JWT {@link useAdminStatus} (same as {@link AdminGuard} / sidebar).
 *
 * In `next dev`, the gate is skipped so layout and UI can be edited without admin JWT claims.
 * Production/static builds still enforce session + admin.
 */
export function WlHomeV2AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const { isAdmin } = useAdminStatus(session)

  useEffect(() => {
    if (DEV_BYPASS_ADMIN_GATE) return
    if (authLoading) return
    if (!session || !isAdmin) {
      router.replace("/")
    }
  }, [session, isAdmin, authLoading, router])

  if (DEV_BYPASS_ADMIN_GATE) {
    return <>{children}</>
  }

  if (authLoading) {
    return <WlHomeV2PageLoading message="Verifying credentials…" />
  }

  if (!session || !isAdmin) {
    return null
  }

  return <>{children}</>
}
