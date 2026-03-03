"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()

  const [email, setEmail] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push("/")
    }
  }

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

      const { error, data } = await signUp(email, password)
      if (error) throw error

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
        router.replace("/profile/overview")
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to sign up"
      setError(message)
    } finally {
      setLoading(false)
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

        <div className="flex flex-1 flex-col px-6 pb-4 pt-2">
          {message ? (
            <div className="space-y-4">
              <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                {message}
              </p>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push("/login")}
              >
                Back to login
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col gap-3"
            >
              {error && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, 16))}
                  maxLength={16}
                  placeholder="Choose a username"
                />
                <p className="text-[0.7rem] text-muted-foreground">
                  (maximum 16 characters)
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>

              <SheetFooter className="mt-4 gap-2 px-0">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Creating account..." : "Sign up"}
                </Button>
              </SheetFooter>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

