"use client"

import "./setlist-entry-discourse-brain.css"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Check, X } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { isDevAuthMockSessionActive } from "@/lib/dev-auth-mock"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import {
  formatSetlistBrainToasts,
  type SetlistBrainResponse,
} from "@/lib/setlist-push-admin-toast"
import { cn } from "@/lib/utils"
import type { AdminSetlistEntryData } from "@/types/admin"

const OUTCOME_RESET_MS = 2500

type DiscourseBrainStatus = "idle" | "sending" | "success" | "error"

interface SetlistEntryDiscourseBrainProps {
  entry: AdminSetlistEntryData
  showId: string
}

/** Row control — posts “now playing” for this entry to Discourse chat. */
export function SetlistEntryDiscourseBrain({
  entry,
  showId,
}: SetlistEntryDiscourseBrainProps) {
  const { session } = useAuth()
  const [status, setStatus] = useState<DiscourseBrainStatus>("idle")

  useEffect(() => {
    setStatus("idle")
  }, [showId, entry.entry_id])

  const setOutcomeWithReset = (outcome: "success" | "error") => {
    setStatus(outcome)
    window.setTimeout(() => {
      setStatus((current) => (current === outcome ? "idle" : current))
    }, OUTCOME_RESET_MS)
  }

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (status === "sending") return

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

    setStatus("sending")
    try {
      const { data, error } = await invokeDproAdmin<SetlistBrainResponse>(token, {
        action: "setlist_discourse_now_playing",
        entry_id: entry.entry_id,
      })
      if (error) throw new Error(error)
      const toasts = formatSetlistBrainToasts(data)
      setOutcomeWithReset(toasts.failed ? "error" : "success")
      for (const message of toasts.success) toast.success(message)
      for (const message of toasts.error) toast.error(message)
    } catch (err) {
      setOutcomeWithReset("error")
      toast.error(
        err instanceof Error ?
          err.message
        : "Failed to send now playing message.",
      )
    }
  }

  return (
    <button
      type="button"
      className={cn(
        "wl-home-v2-admin-setlist-discourse-brain",
        status === "success" && "wl-home-v2-admin-setlist-discourse-brain--success",
        status === "error" && "wl-home-v2-admin-setlist-discourse-brain--error",
      )}
      disabled={status === "sending"}
      onClick={(event) => void handleClick(event)}
      title="Send now playing to Discourse"
      aria-label={`Send now playing for ${entry.entry_song ?? "song"} to Discourse`}
    >
      {status === "success" ?
        <Check
          className="wl-home-v2-admin-setlist-discourse-brain__icon"
          weight="bold"
          aria-hidden
        />
      : status === "error" ?
        <X
          className="wl-home-v2-admin-setlist-discourse-brain__icon"
          weight="bold"
          aria-hidden
        />
      : <Image
          src="/Brain.jpg"
          alt=""
          width={19}
          height={19}
          className="wl-home-v2-admin-setlist-discourse-brain__img"
        />
      }
    </button>
  )
}
