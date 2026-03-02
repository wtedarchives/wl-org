"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signIn } = useAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [authSuccess, setAuthSuccess] = React.useState(false)

  const from = searchParams.get("from") || "/"

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push(from)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) throw error

      setAuthSuccess(true)
      setTimeout(() => {
        router.replace(from)
      }, 800)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in"
      setError(message)
    } finally {
      setLoading(false)
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
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-3 px-6 pb-4 pt-2"
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
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
              {loading
                ? "Signing in..."
                : authSuccess
                  ? "Login successful!"
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

