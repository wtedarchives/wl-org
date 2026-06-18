"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SetlistGameWlV2Panel,
  useSetlistGameWlV2Chrome,
} from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"
import {
  useWlHomeV2LoginAction,
  useWlHomeV2SignupAction,
} from "@/components/wl-home-v2/wl-home-v2-open-login-context"

export function LoginPrompt() {
  const wlV2 = useSetlistGameWlV2Chrome()
  const openLogin = useWlHomeV2LoginAction()
  const openSignup = useWlHomeV2SignupAction()

  const inner = (
    <p
      className={
        wlV2 ? "px-1 py-2 text-xs text-white/75" : "text-xs text-muted-foreground"
      }
    >
      You need to be logged in to participate in Setlist Game.{" "}
      {wlV2 ?
        <>
          <button
            type="button"
            className="font-medium text-[var(--wl-light-orange)] hover:underline"
            onClick={() => openLogin()}
          >
            Log in
          </button>{" "}
          or{" "}
          <button
            type="button"
            className="font-medium text-[var(--wl-light-orange)] hover:underline"
            onClick={() => openSignup()}
          >
            sign up
          </button>{" "}
        </>
      : <>
          <button
            type="button"
            className="font-medium hover:underline"
            onClick={() => openLogin()}
          >
            Log in
          </button>{" "}
          or{" "}
          <button
            type="button"
            className="font-medium hover:underline"
            onClick={() => openSignup()}
          >
            sign up
          </button>{" "}
        </>
      }
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
