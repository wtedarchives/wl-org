"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { LoginCredentialsForm } from "@/components/auth/login-credentials-form"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const formIdPrefix = React.useId()

  const from = searchParams.get("from") || "/"

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push(from)
    }
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="max-w-sm">
        <SheetHeader>
          <SheetTitle>Sign in to your account</SheetTitle>
          <SheetDescription>
            Use your Dripfield.pro credentials to continue.
          </SheetDescription>
        </SheetHeader>
        <LoginCredentialsForm
          formIdPrefix={formIdPrefix}
          redirectTo={from}
          variant="sheet"
        />
      </SheetContent>
    </Sheet>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-[50vh]" />}>
      <LoginForm />
    </React.Suspense>
  )
}
