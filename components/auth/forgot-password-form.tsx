"use client"

import * as React from "react"
import { useAuth } from "@/components/auth-context"

export type ForgotPasswordFormVariant = "sheet" | "home"

type ForgotPasswordFormProps = {
  variant: ForgotPasswordFormVariant
  formIdPrefix: string
  onBackToLogin: () => void
}

export function ForgotPasswordForm({
  variant,
  onBackToLogin,
}: ForgotPasswordFormProps) {
  const { resetPassword } = useAuth()

  if (variant === "home") {
    return (
      <div className="modal-login-form">
        <p className="modal-login-signup-hint">
          Password reset is handled on Wysteria Lane Community.
        </p>
        <button
          type="button"
          className="wbtn primary modal-login-submit"
          onClick={() => resetPassword()}
        >
          Reset password on Wysteria Lane
        </button>
        <div className="modal-login-forgot-below">
          <button
            type="button"
            className="modal-login-text-link"
            onClick={onBackToLogin}
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 px-6 pb-4 pt-2">
      <p className="text-sm text-muted-foreground">
        Password reset is handled on Wysteria Lane Community.
      </p>
      <button
        type="button"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        onClick={() => resetPassword()}
      >
        Reset password on Wysteria Lane
      </button>
      <button
        type="button"
        className="text-sm text-muted-foreground hover:underline"
        onClick={onBackToLogin}
      >
        Back to login
      </button>
    </div>
  )
}
