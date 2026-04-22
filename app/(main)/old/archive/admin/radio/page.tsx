"use client"

import { useEffect } from "react"
import { AdminGuard } from "@/components/dpro/admin/admin-guard"
import { AdminRadio } from "@/components/dpro/admin/admin-radio"

export default function AdminRadioPage() {
  useEffect(() => {
    document.title = "Radio — Admin — WysteriaLane.org"
    return () => {
      document.title = "WysteriaLane.org"
    }
  }, [])

  return (
    <AdminGuard>
      <div className="@container/main flex min-w-0 flex-1 flex-col gap-2 overflow-hidden rounded-b-none p-3 sm:p-4 md:p-6 md:rounded-b-xl">
        <AdminRadio />
      </div>
    </AdminGuard>
  )
}
