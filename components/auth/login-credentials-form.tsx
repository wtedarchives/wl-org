"use client"

import * as React from "react"
import { useAuth } from "@/components/auth-context"

export type LoginCredentialsFormVariant = "sheet" | "home"

type LoginCredentialsFormProps = {
  redirectTo?: string
  variant: LoginCredentialsFormVariant
  onSuccess?: () => void
  formIdPrefix: string
  onForgotPassword?: () => void
  onSignUp?: () => void
}

export function LoginCredentialsForm({
  variant,
  onForgotPassword,
  onSignUp,
}: LoginCredentialsFormProps) {
  const { signIn } = useAuth()

  if (variant === "home") {
    return (
      <div className="modal-login-form">
        <button
          type="button"
          className="wbtn primary modal-login-submit"
          onClick={() => signIn()}
        >
          Sign in with Wysteria Lane
        </button>
        <div className="modal-login-forgot-below">
          <button
            type="button"
            className="modal-login-text-link"
            onClick={() =>
              (onForgotPassword ??
                (() =>
                  window.location.assign(
                    "https://community.wysterialane.org/session/forgot_password",
                  )))()
            }
          >
            Forgot your password?
          </button>
        </div>
        <p className="modal-login-signup-hint">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="modal-login-text-link"
            onClick={() => (onSignUp ?? (() => signIn()))()}
          >
            Sign up
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 px-6 pb-4 pt-2">
      <button
        type="button"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        onClick={() => signIn()}
      >
        Sign in with Wysteria Lane
      </button>
      <p className="text-center text-[0.7rem] text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          className="text-[0.7rem] text-primary underline-offset-4 hover:underline"
          onClick={() => signIn()}
        >
          Sign up
        </button>
      </p>
    </div>
  )
}
