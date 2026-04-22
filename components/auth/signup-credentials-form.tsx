"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SheetFooter } from "@/components/ui/sheet"

export type SignupCredentialsFormVariant = "sheet" | "home"

type SignupCredentialsFormProps = {
  variant: SignupCredentialsFormVariant
  formIdPrefix: string
  /** After email-confirm signup (no session). */
  onBackToLogin?: () => void
}

export function SignupCredentialsForm({
  variant,
  formIdPrefix,
  onBackToLogin,
}: SignupCredentialsFormProps) {
  const router = useRouter()
  const { signUp } = useAuth()

  const [email, setEmail] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const emailId = `${formIdPrefix}-email`
  const usernameId = `${formIdPrefix}-username`
  const passwordId = `${formIdPrefix}-password`
  const confirmId = `${formIdPrefix}-confirm`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!username.trim()) {
      setError("Username is required")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured")
      }

      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single()

      if (existingUser) {
        setError("Username already taken. Please choose another.")
        setLoading(false)
        return
      }

      const { error: signErr, data } = await signUp(email, password)
      if (signErr) throw signErr

      if (data?.user && data?.session && supabase) {
        await supabase.auth.setSession(data.session)

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        if (profileError) throw profileError
      }

      if (data?.user && !data.session) {
        setMessage("Check your email for a confirmation link")
      } else if (data?.user && data.session) {
        router.replace("/old/archive/profile/overview")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign up"
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

  if (message) {
    const successClass =
      variant === "home" ?
        "modal-auth-success"
      : "rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400"

    if (variant === "home") {
      return (
        <div className="modal-login-form modal-auth-post-submit">
          <p className={successClass}>{message}</p>
          {onBackToLogin ?
            <button
              type="button"
              className="wbtn primary modal-login-submit"
              onClick={onBackToLogin}
            >
              Back to sign in
            </button>
          : null}
        </div>
      )
    }
    return (
      <div className="flex flex-1 flex-col gap-3 px-6 pb-4 pt-2">
        <p className={successClass}>{message}</p>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => router.push("/login")}
        >
          Back to login
        </Button>
      </div>
    )
  }

  const usernameHint =
    variant === "home" ?
      <p className="modal-signup-hint">(maximum 16 characters)</p>
    : (
      <p className="text-[0.7rem] text-muted-foreground">
        (maximum 16 characters)
      </p>
    )

  if (variant === "home") {
    return (
      <form className="modal-login-form" onSubmit={handleSubmit}>
        {errorEl}
        <div className="modal-login-field">
          <Label htmlFor={emailId}>Email address</Label>
          <Input
            id={emailId}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="modal-login-field">
          <Label htmlFor={usernameId}>Username</Label>
          <Input
            id={usernameId}
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 16))}
            maxLength={16}
            placeholder="Choose a username"
          />
          {usernameHint}
        </div>
        <div className="modal-login-field">
          <Label htmlFor={passwordId}>Password</Label>
          <Input
            id={passwordId}
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password"
          />
        </div>
        <div className="modal-login-field">
          <Label htmlFor={confirmId}>Confirm password</Label>
          <Input
            id={confirmId}
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
          />
        </div>
        <button
          type="submit"
          className="wbtn primary modal-login-submit"
          disabled={loading}
        >
          {loading ? "Creating account…" : "Sign up"}
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
        <Label htmlFor={emailId}>Email address</Label>
        <Input
          id={emailId}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={usernameId}>Username</Label>
        <Input
          id={usernameId}
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value.slice(0, 16))}
          maxLength={16}
          placeholder="Choose a username"
        />
        {usernameHint}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={passwordId}>Password</Label>
        <Input
          id={passwordId}
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create password"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={confirmId}>Confirm password</Label>
        <Input
          id={confirmId}
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
        />
      </div>
      <SheetFooter className="mt-4 gap-2 px-0">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Sign up"}
        </Button>
      </SheetFooter>
    </form>
  )
}
