"use client"

import "./setlist-show-event-actions.css"

import { useEffect, useState } from "react"
import { Check, X } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { isDevAuthMockSessionActive } from "@/lib/dev-auth-mock"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { cn } from "@/lib/utils"
import type { ShowData } from "@/types/admin"

const SETLIST_SHOW_EVENT_ACTIONS = [
  { label: "Onstage", event: "onstage" },
  { label: "Set Break", event: "set_break" },
  { label: "Encore Break", event: "encore_break" },
  { label: "End Show", event: "end_show" },
] as const

const OUTCOME_RESET_MS = 2500

type SetlistShowEventAction = (typeof SETLIST_SHOW_EVENT_ACTIONS)[number]
type SetlistShowEventLabel = SetlistShowEventAction["label"]
type SetlistShowEventButtonStatus = "idle" | "sending" | "success" | "error"

interface SetlistShowEventActionsProps {
  selectedShow: ShowData | null
}

/** Show timing markers — Discourse chat announcements (read-only DB + post). */
export function SetlistShowEventActions({
  selectedShow,
}: SetlistShowEventActionsProps) {
  const { session } = useAuth()
  const [buttonStatus, setButtonStatus] = useState<
    Partial<Record<SetlistShowEventLabel, SetlistShowEventButtonStatus>>
  >({})

  useEffect(() => {
    setButtonStatus({})
  }, [selectedShow?.show_id])

  const isAnySending = Object.values(buttonStatus).some(
    (status) => status === "sending",
  )

  const setOutcomeWithReset = (
    label: SetlistShowEventLabel,
    outcome: "success" | "error",
  ) => {
    setButtonStatus((prev) => ({ ...prev, [label]: outcome }))
    window.setTimeout(() => {
      setButtonStatus((prev) => {
        if (prev[label] !== outcome) return prev
        const next = { ...prev }
        delete next[label]
        return next
      })
    }, OUTCOME_RESET_MS)
  }

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

    setButtonStatus((prev) => ({ ...prev, [label]: "sending" }))
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "setlist_discourse_show_event",
        show_id: selectedShow.show_id,
        event,
      })
      if (error) throw new Error(error)
      setOutcomeWithReset(label, "success")
    } catch (err) {
      setOutcomeWithReset(label, "error")
      toast.error(
        err instanceof Error ?
          err.message
        : `Failed to send ${label} message.`,
      )
    }
  }

  return (
    <div className="wl-home-v2-admin-setlist-show-events">
      {SETLIST_SHOW_EVENT_ACTIONS.map((action) => {
        const status = buttonStatus[action.label] ?? "idle"

        return (
          <Button
            key={action.label}
            type="button"
            variant="ghost"
            size="sm"
            disabled={!selectedShow || isAnySending}
            onClick={() => void handleSend(action)}
            className={cn(
              "wl-home-v2-tours-header-pill wl-home-v2-admin-setlist-show-events__btn",
              status === "success" &&
                "wl-home-v2-admin-setlist-show-events__btn--success",
              status === "error" &&
                "wl-home-v2-admin-setlist-show-events__btn--error",
            )}
          >
            {status === "success" ?
              <Check
                className="wl-home-v2-admin-setlist-show-events__icon"
                weight="bold"
                aria-hidden
              />
            : status === "error" ?
              <X
                className="wl-home-v2-admin-setlist-show-events__icon"
                weight="bold"
                aria-hidden
              />
            : null}
            {status === "sending" ? "Sending…" : action.label}
          </Button>
        )
      })}
    </div>
  )
}
