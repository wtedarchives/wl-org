"use client"

import { useEffect, useState } from "react"
import { CaretDown } from "@phosphor-icons/react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Textarea } from "@/components/ui/textarea"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface BrainsCoachNotesProps {
  showId: string
  readOnly: boolean
}

/**
 * Show-level coach's notes — the only field on `shows` a setlister may write.
 *
 * Collapsed in the brains header so it is one tap away without taking space from
 * the live setlist.
 */
export function BrainsCoachNotes({ showId, readOnly }: BrainsCoachNotesProps) {
  const { session } = useAuth()
  const token = session?.token ?? null

  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setOpen(false)
    setSaved(null)
    setDraft("")
  }, [showId])

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
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="wl-home-v2-brains-coach">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="wl-home-v2-brains-coach__toggle"
            aria-expanded={open}
          >
            <span>Coach&rsquo;s notes</span>
            {dirty ?
              <span className="wl-home-v2-brains-coach__unsaved">Unsaved</span>
            : null}
            <CaretDown
              className={cn(
                "ml-auto size-3.5 shrink-0 opacity-70 transition-transform duration-200",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="wl-home-v2-brains-coach__panel">
            {saved === null ?
              <p className="m-0 text-xs text-white/65">Loading notes…</p>
            : <>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  readOnly={readOnly}
                  rows={4}
                  placeholder="Notes for this show"
                  className="font-mono text-xs"
                />
                {!readOnly ?
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="wl-home-v2-tours-header-pill mt-2 min-h-11"
                    disabled={!dirty || saving}
                    onClick={() => void handleSave()}
                  >
                    {saving ? "Saving…" : dirty ? "Save notes" : "Saved"}
                  </Button>
                : null}
              </>
            }
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
