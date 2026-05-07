"use client"

import * as React from "react"
import { useAuth } from "@/components/auth-context"

export type SignupCredentialsFormVariant = "sheet" | "home"

type SignupCredentialsFormProps = {
  variant: SignupCredentialsFormVariant
  formIdPrefix: string
  onBackToLogin?: () => void
}

export function SignupCredentialsForm({
  variant,
  onBackToLogin,
}: SignupCredentialsFormProps) {
  const { signUp } = useAuth()

  if (variant === "home") {
    return (
      <div className="modal-login-form">
        <button
          type="button"
          className="wbtn primary modal-login-submit"
          onClick={() => signUp()}
        >
          Create account with Wysteria Lane
        </button>
        {onBackToLogin ?
          <div className="modal-login-forgot-below">
            <button
              type="button"
              className="modal-login-text-link"
              onClick={onBackToLogin}
            >
              Back to sign in
            </button>
          </div>
        : null}
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 px-6 pb-4 pt-2">
      <button
        type="button"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        onClick={() => signUp()}
      >
        Create account with Wysteria Lane
      </button>
    </div>
  )
}
