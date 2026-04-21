"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export default function ResetPasswordPage() {
  const router = useRouter()
  const formIdPrefix = React.useId()

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push("/login")
    }
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="max-w-sm">
        <SheetHeader>
          <SheetTitle>Reset your password</SheetTitle>
          <SheetDescription>
            Enter the email associated with your account and we&apos;ll send
            you a reset link.
          </SheetDescription>
        </SheetHeader>

        <ForgotPasswordForm
          variant="sheet"
          formIdPrefix={formIdPrefix}
          onBackToLogin={() => router.push("/login")}
        />
      </SheetContent>
    </Sheet>
  )
}
