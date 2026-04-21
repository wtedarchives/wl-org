"use client"

import * as React from "react"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SheetFooter } from "@/components/ui/sheet"

export type ForgotPasswordFormVariant = "sheet" | "home"

type ForgotPasswordFormProps = {
  variant: ForgotPasswordFormVariant
  formIdPrefix: string
  /** Home: return to login modal. Sheet: usually `/login`. */
  onBackToLogin: () => void
}

export function ForgotPasswordForm({
  variant,
  formIdPrefix,
  onBackToLogin,
}: ForgotPasswordFormProps) {
  const { resetPassword } = useAuth()

  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const emailFieldId = `${formIdPrefix}-email`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const { error: resetErr } = await resetPassword(email)
      if (resetErr) throw resetErr
      setMessage("Check your email for a password reset link")
    } catch (err: unknown) {
      const msg =
        err instanceof Error ?
          err.message
        : "Failed to send reset password email"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const errorEl =
    error ?
      <p
        className={
          variant === "home" ?
            "modal-login-error"
          : "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        }
        role="alert"
      >
        {error}
      </p>
    : null

  const successEl =
    message ?
      <p
        className={
          variant === "home" ?
            "modal-auth-success"
          : "rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400"
        }
      >
        {message}
      </p>
    : null

  if (message) {
    if (variant === "home") {
      return (
        <div className="modal-login-form modal-auth-post-submit">
          {successEl}
          <button
            type="button"
            className="wbtn primary modal-login-submit"
            onClick={onBackToLogin}
          >
            Back to sign in
          </button>
        </div>
      )
    }
    return (
      <div className="flex flex-1 flex-col gap-3 px-6 pb-4 pt-2">
        {successEl}
        <Button className="w-full" variant="outline" onClick={onBackToLogin}>
          Back to login
        </Button>
      </div>
    )
  }

  if (variant === "home") {
    return (
      <form className="modal-login-form" onSubmit={handleSubmit}>
        {errorEl}
        <div className="modal-login-field">
          <Label htmlFor={emailFieldId}>Email address</Label>
          <Input
            id={emailFieldId}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          className="wbtn primary modal-login-submit"
          disabled={loading}
        >
          {loading ? "Sending…" : "Send reset instructions"}
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
      </form>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col gap-3 px-6 pb-4 pt-2"
    >
      {errorEl}
      <div className="space-y-1.5">
        <Label htmlFor={emailFieldId}>Email address</Label>
        <Input
          id={emailFieldId}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <SheetFooter className="mt-4 gap-2 px-0">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending email..." : "Send reset instructions"}
        </Button>
      </SheetFooter>
    </form>
  )
}
