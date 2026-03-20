"use client"

import { useEffect } from "react"
import { AdminGuard } from "@/components/dpro/admin/admin-guard"
import { AdminPanel } from "@/components/dpro/admin/admin-panel"

export default function AdminPage() {
  useEffect(() => {
    document.title = "Admin — Wysteria Lane"
    return () => {
      document.title = "Wysteria Lane"
    }
  }, [])

  return (
    <AdminGuard>
      <div className="@container/main flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4 md:p-6">
        <AdminPanel />
      </div>
    </AdminGuard>
  )
}
