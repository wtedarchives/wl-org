"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SetlistGameWlV2Panel,
  useSetlistGameWlV2Chrome,
} from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"

export function LoginPrompt() {
  const wlV2 = useSetlistGameWlV2Chrome()

  const inner = (
    <p
      className={
        wlV2 ? "px-1 py-2 text-xs text-white/75" : "text-xs text-muted-foreground"
      }
    >
      You need to be logged in to participate in Setlist Game.{" "}
      <Link
        href="/login"
        className={
          wlV2 ?
            "font-medium text-[var(--wl-light-orange)] no-underline hover:underline"
          : "font-medium no-underline hover:underline"
        }
      >
        Log in
      </Link>{" "}
      or{" "}
      <Link
        href="/signup"
        className={
          wlV2 ?
            "font-medium text-[var(--wl-light-orange)] no-underline hover:underline"
          : "font-medium no-underline hover:underline"
        }
      >
        sign up
      </Link>{" "}
      to start playing!
    </p>
  )

  if (wlV2) {
    return <SetlistGameWlV2Panel title="How To Play">{inner}</SetlistGameWlV2Panel>
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">How To Play</CardTitle>
      </CardHeader>
      <CardContent className="py-0 pb-2">{inner}</CardContent>
    </Card>
  )
}
