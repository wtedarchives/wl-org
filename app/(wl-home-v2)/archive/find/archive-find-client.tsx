"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { FindDialog } from "@/components/dpro/admin/find-dialog"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { useAdminStatus } from "@/hooks/use-admin-status"

export function ArchiveFindClient() {
  const router = useRouter()
  const { session } = useAuth()
  const { isAdmin } = useAdminStatus(session)

  useEffect(() => {
    document.title = "Find — WTEDRadio.com"
    return () => {
      document.title = "WTEDRadio.com"
    }
  }, [])

  useEffect(() => {
    // Wait until we know auth; non-admins leave this admin-only tool.
    if (session === undefined) return
    if (!isAdmin) {
      router.replace("/archive")
    }
  }, [session, isAdmin, router])

  if (!isAdmin) {
    return (
      <WlHomeV2>
        <span className="sr-only">Find</span>
      </WlHomeV2>
    )
  }

  return (
    <>
      <WlHomeV2>
        <span className="sr-only">Find show or user</span>
      </WlHomeV2>
      <FindDialog
        open={true}
        onOpenChange={(open) => {
          if (!open) router.push("/archive")
        }}
      />
    </>
  )
}
