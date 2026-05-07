"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { useAdminStatus } from "@/hooks/use-admin-status"
import { Card, CardContent } from "@/components/ui/card"

interface AdminGuardProps {
  children: React.ReactNode
}

/**
 * Redirects non-admin users away from admin pages.
 * Waits for both auth and admin check to complete before redirecting.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdminStatus(session)

  const isLoading = authLoading || adminLoading

  useEffect(() => {
    if (isLoading) return
    if (!session) {
      router.replace("/")
      return
    }
    if (!isAdmin) {
      router.replace("/")
    }
  }, [session, isAdmin, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-muted-foreground">
              Verifying credentials...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return null
  }

  return <>{children}</>
}
