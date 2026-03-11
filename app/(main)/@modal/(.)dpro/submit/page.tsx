"use client"

import { useRouter } from "next/navigation"
import { SubmitDialog } from "@/components/dpro/submit-dialog"

export default function SubmitModalPage() {
  const router = useRouter()

  return (
    <SubmitDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
    />
  )
}
