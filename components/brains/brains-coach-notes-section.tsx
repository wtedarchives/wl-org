"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

import { useBrainsWork } from "./brains-work-context"

/**
 * The show's coach's notes — the only field on `shows` a setlister may write.
 *
 * `shows_update` accepts 19 columns for an admin; the Edge Function narrows that to
 * `show_coachnotes` alone for a brains caller and rejects a payload carrying
 * anything else. Nothing from the rest of the Show tab is rendered here, and
 * `show_callbacks` in particular is deliberately absent — it surfaces publicly on
 * the setlist page.
 */
export function BrainsCoachNotesSection() {
  const { showId, readOnly } = useBrainsWork()
  const { session } = useAuth()
  const token = session?.token ?? null

  const [saved, setSaved] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!showId || !supabase) return
    const client = supabase
    let cancelled = false

    async function run() {
      const { data } = await client
        .from("shows")
        .select("show_coachnotes")
        .eq("show_id", showId)
        .maybeSingle()
      if (cancelled) return
      const value = ((data?.show_coachnotes as string | null) ?? "").toString()
      setSaved(value)
      setDraft(value)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [showId])

  if (!showId) return null

  const dirty = saved !== null && draft !== saved

  const handleSave = async () => {
    if (!token || !dirty) return
    setSaving(true)
    try {
      const next = draft.trim() === "" ? null : draft
      const { error } = await invokeDproAdmin(token, {
        action: "shows_update",
        show_id: showId,
        patch: { show_coachnotes: next },
      })
      if (error) throw new Error(error)
      setSaved(draft)
      toast.success("Notes saved.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save notes.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-w-0 flex-col">
      <div
        className={cn(
          "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
          "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-2 border-b border-[rgb(29,32,30)] pb-3",
        )}
      >
        <span className="wp-head-date min-w-0 flex-1 truncate">
          Coach&rsquo;s notes
        </span>
        {!readOnly ?
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="wl-home-v2-tours-header-pill"
            disabled={!dirty || saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving…" : dirty ? "Save notes" : "Saved"}
          </Button>
        : null}
      </div>

      <div className="wl-home-v2-archive-admin-song-form p-3 sm:p-4">
        {saved === null ?
          <p className="m-0 text-xs text-white/65">Loading notes…</p>
        : <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            readOnly={readOnly}
            rows={4}
            placeholder="Notes for this show"
          />
        }
      </div>
    </div>
  )
}
