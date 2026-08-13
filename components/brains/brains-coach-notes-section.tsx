"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"

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
    <section className="flex min-w-0 flex-col gap-2 border-t border-white/10 pt-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-white/90">
          Coach&rsquo;s notes
        </span>
        {!readOnly && (
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
        )}
      </div>

      {saved === null ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-white/50">
          Loading notes…
        </p>
      ) : (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          readOnly={readOnly}
          rows={4}
          placeholder="Notes for this show"
          className="text-sm"
        />
      )}
    </section>
  )
}
