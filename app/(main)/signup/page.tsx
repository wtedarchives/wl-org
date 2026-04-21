"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { SignupCredentialsForm } from "@/components/auth/signup-credentials-form"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export default function SignupPage() {
  const router = useRouter()
  const formIdPrefix = React.useId()

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push("/")
    }
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="max-w-sm">
        <SheetHeader>
          <SheetTitle>Create a new account</SheetTitle>
          <SheetDescription>
            Choose a username and password to get started.
          </SheetDescription>
        </SheetHeader>

        <SignupCredentialsForm
          variant="sheet"
          formIdPrefix={formIdPrefix}
        />
      </SheetContent>
    </Sheet>
  )
}
