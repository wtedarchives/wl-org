"use client"

import { useEffect } from "react"
import { AdminGuard } from "@/components/dpro/admin/admin-guard"
import { Bugs } from "@/components/dpro/admin/bugs"

export default function BugsPage() {
  useEffect(() => {
    document.title = "Bugs — WysteriaLane.org"
    return () => {
      document.title = "WysteriaLane.org"
    }
  }, [])

  return (
    <AdminGuard>
      <div className="@container/main flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
        <Bugs />
      </div>
    </AdminGuard>
  )
}
