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
  { label: "Onstage", event: "onstage" },
  { label: "Set Break", event: "set_break" },
  { label: "Encore Break", event: "encore_break" },
  { label: "End Show", event: "end_show" },
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
  const [sending, setSending] = useState<SetlistShowEventAction["label"] | null>(
    null,
  )

  const handleSend = async ({ label, event }: SetlistShowEventAction) => {
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

    setSending(label)
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "setlist_discourse_show_event",
        show_id: selectedShow.show_id,
        event,
      })
      if (error) throw new Error(error)
      toast.success(`${label} message sent to Discourse.`)
    } catch (err) {
      toast.error(
        err instanceof Error ?
          err.message
        : `Failed to send ${label} message.`,
      )
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="wl-home-v2-admin-setlist-show-events">
      {SETLIST_SHOW_EVENT_ACTIONS.map(({ label, event }) => (
        <Button
          key={label}
          type="button"
          variant="ghost"
          size="sm"
          disabled={!selectedShow || sending !== null}
          onClick={() => void handleSend({ label, event })}
          className="wl-home-v2-tours-header-pill wl-home-v2-admin-setlist-show-events__btn"
        >
          {sending === label ? "Sending…" : label}
        </Button>
      ))}
    </div>
  )
}
