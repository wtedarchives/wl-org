"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginPrompt() {
  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">How To Play</CardTitle>
      </CardHeader>
      <CardContent className="py-0 pb-2">
        <p className="text-xs text-muted-foreground">
          You need to be logged in to participate in Echo of a Show.{" "}
          <Link href="/login" className="font-medium no-underline hover:underline underline-offset-2">
            Log in
          </Link>{" "}
          or{" "}
          <Link href="/signup" className="font-medium no-underline hover:underline underline-offset-2">
            sign up
          </Link>{" "}
          to start playing!
        </p>
      </CardContent>
    </Card>
  )
}
