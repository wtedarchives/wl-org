"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
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

export default function ResetPasswordPage() {
  const router = useRouter()
  const { resetPassword } = useAuth()

  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push("/login")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const { error } = await resetPassword(email)
      if (error) throw error
      setMessage("Check your email for a password reset link")
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to send reset password email"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="max-w-sm">
        <SheetHeader>
          <SheetTitle>Reset your password</SheetTitle>
          <SheetDescription>
            Enter the email associated with your account and we&apos;ll send
            you a reset link.
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

              <SheetFooter className="mt-4 gap-2 px-0">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Sending email..." : "Send reset instructions"}
                </Button>
              </SheetFooter>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

