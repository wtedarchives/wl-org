"use client"

import "./setlist-show-event-actions.css"

import { useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { isDevAuthMockSessionActive } from "@/lib/dev-auth-mock"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import type { ShowData } from "@/types/admin"

const SETLIST_SHOW_EVENT_ACTIONS = [
  "Onstage",
  "Set Break",
  "Encore Break",
  "End Show",
] as const

type SetlistShowEventAction = (typeof SETLIST_SHOW_EVENT_ACTIONS)[number]

interface SetlistShowEventActionsProps {
  selectedShow: ShowData | null
}

/** Show timing markers — Discourse chat announcements (read-only DB + post). */
export function SetlistShowEventActions({
  selectedShow,
}: SetlistShowEventActionsProps) {
  const { session } = useAuth()
  const [sending, setSending] = useState<SetlistShowEventAction | null>(null)

  const handleOnstage = async () => {
    if (!selectedShow) {
      toast.error("Select a show first.")
      return
    }
    if (isDevAuthMockSessionActive()) {
      toast.error(
        "Sign in with your real WLC account to send Discourse messages. Dev mock sessions cannot call Edge Functions.",
      )
      return
    }
    const token = session?.token
    if (!token) {
      toast.error("Sign in with your WLC account to send Discourse messages.")
      return
    }

    setSending("Onstage")
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "setlist_discourse_onstage",
        show_id: selectedShow.show_id,
      })
      if (error) throw new Error(error)
      toast.success("Onstage message sent to Discourse.")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send Onstage message.",
      )
    } finally {
      setSending(null)
    }
  }

  const handleClick = (label: SetlistShowEventAction) => {
    if (label === "Onstage") void handleOnstage()
  }

  return (
    <div className="wl-home-v2-admin-setlist-show-events">
      {SETLIST_SHOW_EVENT_ACTIONS.map((label) => (
        <Button
          key={label}
          type="button"
          variant="ghost"
          size="sm"
          disabled={!selectedShow || sending !== null}
          onClick={() => handleClick(label)}
          className="wl-home-v2-tours-header-pill wl-home-v2-admin-setlist-show-events__btn"
        >
          {sending === label ? "Sending…" : label}
        </Button>
      ))}
    </div>
  )
}
