"use client"

import { useMemo, useState } from "react"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"

import { useBrainsOptions } from "./brains-options-context"

const LABEL_CLS =
  "font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/60"

/**
 * Every artist in the archive, as a list, plus a box to add one.
 *
 * A list rather than a dropdown, per spec — the point is to see what is already
 * there before adding. There are 394 artists, so a filter box sits above it, but
 * the list itself is always visible rather than hidden behind a picker.
 *
 * No editing: brains can insert an artist and nothing else. Renaming one would
 * cascade through `songs.song_originalartist`, which is a foreign key onto this
 * table.
 */
export function BrainsAddArtist() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const { artists, refresh } = useBrainsOptions()

  const [filter, setFilter] = useState("")
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (q === "") return artists
    return artists.filter((a) => a.artist.toLowerCase().includes(q))
  }, [artists, filter])

  const trimmedName = name.trim()
  const duplicate = useMemo(
    () =>
      trimmedName !== "" &&
      artists.some((a) => a.artist.toLowerCase() === trimmedName.toLowerCase()),
    [artists, trimmedName],
  )

  const canSave = trimmedName !== "" && !duplicate && !saving

  const handleAdd = async () => {
    if (!token || !canSave) return
    setSaving(true)
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "rpc_add_artist",
        artist_name: trimmedName,
      })
      if (error) throw new Error(error)
      toast.success(`Added ${trimmedName}.`)
      setName("")
      refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not add that artist.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative min-w-0">
        <MagnifyingGlass
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 opacity-60"
          aria-hidden
        />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter artists"
          className="wl-home-v2-archive-admin-input--with-leading-icon h-8 text-xs"
        />
      </div>

      <div className="flex min-w-0 items-baseline justify-between gap-2">
        <span className={LABEL_CLS}>
          {filtered.length === artists.length
            ? `${artists.length} artists`
            : `${filtered.length} of ${artists.length}`}
        </span>
      </div>

      <ul className="flex max-h-64 min-w-0 flex-col gap-0.5 overflow-y-auto rounded border border-white/10 bg-white/5 p-1">
        {filtered.map((a) => (
          <li
            key={a.artist_id}
            className="min-w-0 truncate px-2 py-0.5 text-xs text-white/80"
          >
            {a.artist}
          </li>
        ))}
        {filtered.length === 0 && (
          <li className={`${LABEL_CLS} px-2 py-1`}>
            No match — safe to add it below
          </li>
        )}
      </ul>

      <div className="flex min-w-0 flex-col gap-2 border-t border-white/10 pt-3">
        <span className={LABEL_CLS}>Add an artist</span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Artist name"
          className="h-8 text-xs"
        />
        {duplicate && (
          <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-amber-200/80">
            Already in the archive
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="wl-home-v2-tours-header-pill self-start"
          disabled={!canSave}
          onClick={() => void handleAdd()}
        >
          {saving ? "Adding…" : "Add artist"}
        </Button>
      </div>
    </div>
  )
}
