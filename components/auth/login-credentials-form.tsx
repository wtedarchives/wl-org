"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SheetFooter } from "@/components/ui/sheet"

export type LoginCredentialsFormVariant = "sheet" | "home"

type LoginCredentialsFormProps = {
  redirectTo: string
  variant: LoginCredentialsFormVariant
  /** Called as soon as sign-in succeeds (e.g. close modal before redirect). */
  onSuccess?: () => void
  /** Stable prefix for field ids (e.g. from `useId()`). */
  formIdPrefix: string
  /** Home modal: open forgot-password flow instead of navigating away. */
  onForgotPassword?: () => void
  /** Home modal: open sign-up flow instead of navigating away. */
  onSignUp?: () => void
}

/**
 * Shared email/password sign-in used by `/login` (sheet) and the home page login modal.
 */
export function LoginCredentialsForm({
  redirectTo,
  variant,
  onSuccess,
  formIdPrefix,
  onForgotPassword,
  onSignUp,
}: LoginCredentialsFormProps) {
  const router = useRouter()
  const { signIn } = useAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [authSuccess, setAuthSuccess] = React.useState(false)

  const emailFieldId = `${formIdPrefix}-email`
  const passwordFieldId = `${formIdPrefix}-password`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signErr } = await signIn(email, password)
      if (signErr) throw signErr

      setAuthSuccess(true)
      onSuccess?.()
      setTimeout(() => {
        router.replace(redirectTo)
      }, 800)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in"
      setError(message)
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

  if (variant === "home") {
    return (
      <form
        className="modal-login-form"
        onSubmit={handleSubmit}
      >
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

        <div className="modal-login-field">
          <Label htmlFor={passwordFieldId}>Password</Label>
          <Input
            id={passwordFieldId}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          className="wbtn primary modal-login-submit"
          disabled={loading || authSuccess}
        >
          {loading ? "Signing in…" : authSuccess ? "Login successful!" : "Login"}
        </button>

        <div className="modal-login-forgot-below">
          <button
            type="button"
            className="modal-login-text-link"
            onClick={() =>
              (onForgotPassword ?? (() => router.push("/reset-password")))()
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
            onClick={() => (onSignUp ?? (() => router.push("/signup")))()}
          >
            Sign up
          </button>
        </p>
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

      <div className="space-y-1.5">
        <Label htmlFor={passwordFieldId}>Password</Label>
        <Input
          id={passwordFieldId}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
        />
      </div>

      <div className="mt-1 text-right">
        <Button
          type="button"
          variant="link"
          size="xs"
          className="px-0 text-xs"
          onClick={() => router.push("/reset-password")}
        >
          Forgot your password?
        </Button>
      </div>

      <SheetFooter className="mt-4 gap-2 px-0">
        <Button
          type="submit"
          disabled={loading || authSuccess}
          className="w-full"
        >
          {loading ?
            "Signing in..."
          : authSuccess ?
            "Login successful!"
          : "Login"}
        </Button>
        <p className="text-center text-[0.7rem] text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Button
            type="button"
            variant="link"
            size="xs"
            className="px-0 text-[0.7rem]"
            onClick={() => router.push("/signup")}
          >
            Sign up
          </Button>
        </p>
      </SheetFooter>
    </form>
  )
}
