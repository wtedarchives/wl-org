"use client"

import type { WysteriaSession } from "@/lib/jwt"
import type { SongPick, SongSelectionModalProps } from "./types"
import { calculateTimeRemaining } from "./utils"

export const createSubmissionHandler = (
  session: WysteriaSession | null,
  show: SongSelectionModalProps["show"],
  songPicks: SongPick[],
  isEditing: boolean,
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setSuccess: React.Dispatch<React.SetStateAction<boolean>>,
  onClose: () => void,
  onSuccess?: () => void
) => {
  return async () => {
    if (!session) {
      setError("You must be logged in to submit picks")
      return
    }

    if (songPicks.length === 0) {
      setError("Please add at least one song")
      return
    }

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!base || !anonKey) {
      setError("Unable to connect. Please try again.")
      return
    }

    const { isSelectionClosed } = calculateTimeRemaining(show.show_time)
    if (isSelectionClosed || show.show_scored) {
      setError(
        "Submission period has closed. You can no longer submit picks for this show.",
      )
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const res = await fetch(`${base}/functions/v1/setlist-game-submission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          show_id: show.show_id,
          isEditing,
          submission_id: show.submission_id ?? null,
          picks: songPicks.map((p) => ({
            id: p.id,
            song: p.song,
            set: p.set,
            setnum: p.setnum,
            placement: p.placement ?? null,
            isBreak: Boolean(p.isBreak),
          })),
        }),
      })

      const data = (await res.json().catch(() => ({}))) as { error?: string }

      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : `Request failed (${res.status})`,
        )
        return
      }

      setSuccess(true)

      onSuccess?.()

      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && error.message ?
          error.message
        : "Failed to submit picks. Please try again."
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }
}
