"use client"

import { useState, useEffect } from "react"

import { useAuth } from "@/components/auth-context"
import type { GameShow } from "@/hooks/use-game-shows"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { convertFromEasternToUTC, convertToEasternDisplay } from "@/lib/utils/show-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function useAdminShowTimeEditor(
  show: GameShow | null,
  onSaved: () => void | Promise<void>,
) {
  const { session } = useAuth()
  const token = session?.token ?? null
  const showId = show?.show_id ?? ""
  const showTime = show?.show_time ?? null

  const [draft, setDraft] = useState(() => convertToEasternDisplay(showTime))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(convertToEasternDisplay(showTime))
    setError(null)
  }, [showId, showTime])

  const baseline = convertToEasternDisplay(showTime)
  const dirty = draft !== baseline

  const handleSave = async () => {
    if (!show) return
    if (!dirty) return
    if (!token) {
      setError("You must be signed in.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const trimmed = draft.trim()
      let payload: string | null = null
      if (trimmed) {
        const utc = convertFromEasternToUTC(trimmed)
        if (!utc) {
          setError("Invalid date/time")
          return
        }
        payload = utc
      }
      const { error: fnErr } = await invokeDproAdmin(token, {
        action: "shows_update",
        show_id: show.show_id,
        patch: { show_time: payload },
      })
      if (fnErr) throw new Error(fnErr)
      await onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return { draft, setDraft, saving, error, dirty, token, handleSave }
}

export function AdminShowTimeCell({
  show,
  onSaved,
}: {
  show: GameShow
  onSaved: () => void | Promise<void>
}) {
  const { draft, setDraft, saving, error, dirty, token, handleSave } =
    useAdminShowTimeEditor(show, onSaved)

  return (
    <div className="flex w-full flex-col items-center justify-center gap-1 text-center">
      <div className="flex flex-nowrap items-center justify-center gap-1.5">
        <Input
          type="datetime-local"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-6 min-h-0 min-w-0 flex-1 px-1.5 py-0 text-[10px] leading-none md:h-6 md:py-0 md:text-[10px] md:leading-none [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:ml-0.5 [&::-webkit-calendar-picker-indicator]:scale-90 [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0 [&::-webkit-datetime-edit-text]:p-0"
          aria-label="Show time (Eastern)"
        />
        <Button
          type="button"
          variant="secondary"
          size="xs"
          disabled={!dirty || saving || !token}
          onClick={handleSave}
          className="shrink-0"
        >
          {saving ? "…" : "Save"}
        </Button>
      </div>
      {error ? (
        <span className="w-full text-[10px] leading-tight text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  )
}
