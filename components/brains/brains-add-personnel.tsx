"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"

import { BrainsLookup } from "./brains-lookup"
import { useBrainsOptions } from "./brains-options-context"

const LABEL_CLS =
  "font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/60"

/**
 * Look up a guest, or add one who just walked on.
 *
 * Category is not offered. The Edge Function pins `guest_category` to `"Guest"`
 * for every brains insert, so a setlister cannot create band members
 * ("Goose (current)" / "Goose (former)") or groups — categories that change how
 * personnel appear across the archive. The server enforces it; this form simply
 * has no control for it.
 *
 * Display name is written silently to match the name, per spec.
 */
export function BrainsAddPersonnel() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const { personnel, refresh } = useBrainsOptions()

  const [name, setName] = useState("")
  const [instrument, setInstrument] = useState("")
  const [saving, setSaving] = useState(false)

  const trimmedName = name.trim()
  const duplicate = useMemo(
    () =>
      trimmedName !== "" &&
      personnel.some((g) => g.guest.toLowerCase() === trimmedName.toLowerCase()),
    [personnel, trimmedName],
  )

  const canSave = trimmedName !== "" && !duplicate && !saving

  const handleAdd = async () => {
    if (!token || !canSave) return
    setSaving(true)
    try {
      // guest_category is stamped server-side; sending it here would be ignored.
      const { error } = await invokeDproAdmin(token, {
        action: "guests_insert_new",
        guest: trimmedName,
        guest_displayname: trimmedName,
        guest_instrument: instrument.trim() === "" ? null : instrument.trim(),
      })
      if (error) throw new Error(error)
      toast.success(`Added ${trimmedName}.`)
      setName("")
      setInstrument("")
      refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not add that person.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <BrainsLookup
        items={personnel}
        keyOf={(g) => g.guest_id}
        labelOf={(g) => g.guest}
        placeholder="Search personnel"
        renderDetail={(g) => (
          <dl className="flex min-w-0 flex-col gap-0.5 text-[11px] text-white/70">
            <div className="flex gap-1">
              <dt className={LABEL_CLS}>Instrument</dt>
              <dd className="min-w-0 break-words">
                {g.guest_instrument ?? "—"}
              </dd>
            </div>
          </dl>
        )}
      />

      <div className="flex min-w-0 flex-col gap-2 border-t border-white/10 pt-3">
        <span className={LABEL_CLS}>Add personnel</span>

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="h-8 text-xs"
        />
        {duplicate && (
          <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-amber-200/80">
            Already in the archive
          </p>
        )}

        <Input
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          placeholder="Instrument"
          className="h-8 text-xs"
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="wl-home-v2-tours-header-pill self-start"
          disabled={!canSave}
          onClick={() => void handleAdd()}
        >
          {saving ? "Adding…" : "Add personnel"}
        </Button>
      </div>
    </div>
  )
}
