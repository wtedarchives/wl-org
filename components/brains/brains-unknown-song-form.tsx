"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import {
  BRAINS_NEW_SONG_CATEGORIES,
  type BrainsNewSongCategoryValue,
} from "@/lib/brains-sets"
import type {
  BrainsArtistOption,
  BrainsSongOption,
} from "@/hooks/use-brains-entry-options"

interface BrainsUnknownSongFormProps {
  songs: BrainsSongOption[]
  artists: BrainsArtistOption[]
  /** Prefill from the song search query that had no match. */
  initialTitle?: string
  onCreated: (songName: string) => void
  onCancel: () => void
  onRefreshOptions: () => void
}

const LABEL_CLS = "mb-0.5 block text-xs font-medium"

/**
 * Create a song that is not in the archive yet.
 *
 * Display name is written to match the title. Original artist uses an existing
 * row when the typed name matches, otherwise the artist is inserted first.
 */
export function BrainsUnknownSongForm({
  songs,
  artists,
  initialTitle = "",
  onCreated,
  onCancel,
  onRefreshOptions,
}: BrainsUnknownSongFormProps) {
  const { session } = useAuth()
  const token = session?.token ?? null

  const [title, setTitle] = useState(initialTitle)
  const [artistQuery, setArtistQuery] = useState("")
  const [artist, setArtist] = useState("")
  const [category, setCategory] = useState<BrainsNewSongCategoryValue | "">("")
  const [saving, setSaving] = useState(false)

  const trimmedTitle = title.trim()
  const duplicate = useMemo(
    () =>
      trimmedTitle !== "" &&
      songs.some((s) => s.song.toLowerCase() === trimmedTitle.toLowerCase()),
    [songs, trimmedTitle],
  )

  const filteredArtists = useMemo(() => {
    const q = artistQuery.trim().toLowerCase()
    if (q === "") return []
    return artists
      .filter((a) => a.artist.toLowerCase().includes(q))
      .slice(0, 20)
  }, [artistQuery, artists])

  const resolvedArtist = artist !== "" ? artist : artistQuery.trim()
  const canSave =
    trimmedTitle !== "" &&
    resolvedArtist !== "" &&
    category !== "" &&
    !duplicate &&
    !saving &&
    !!token

  const handleSave = async () => {
    if (!token || !canSave) return
    const songCategory = category
    if (
      songCategory !== "Unreleased / Miscellaneous" &&
      songCategory !== "Cover Songs"
    ) {
      return
    }
    setSaving(true)
    try {
      const existing = artists.find(
        (a) => a.artist.toLowerCase() === resolvedArtist.toLowerCase(),
      )
      const artistName = existing?.artist ?? resolvedArtist
      if (!existing) {
        const { error } = await invokeDproAdmin(token, {
          action: "rpc_add_artist",
          artist_name: artistName,
        })
        if (error) throw new Error(error)
      }
      const { error } = await invokeDproAdmin(token, {
        action: "songs_insert",
        row: {
          song: trimmedTitle,
          song_displayname: trimmedTitle,
          song_originalartist: artistName,
          song_category: songCategory,
        },
      })
      if (error) throw new Error(error)
      toast.success(`Added ${trimmedTitle}.`)
      onRefreshOptions()
      onCreated(trimmedTitle)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the song.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="wl-home-v2-archive-admin-song-form flex min-w-0 flex-col gap-3">
      <label className="flex min-w-0 flex-col">
        <span className={LABEL_CLS}>Song Name</span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Song name"
          className="h-9 text-sm"
          autoFocus
        />
      </label>
      {duplicate ?
        <p className="m-0 text-xs text-amber-200/90">
          Already in the archive — pick it from the song list instead.
        </p>
      : null}

      <div className="flex min-w-0 flex-col">
        <span className={LABEL_CLS}>Original Artist Name</span>
        {artist !== "" ?
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm">{artist}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0"
              onClick={() => {
                setArtist("")
                setArtistQuery("")
              }}
            >
              Change
            </Button>
          </div>
        : <>
            <Input
              value={artistQuery}
              onChange={(e) => setArtistQuery(e.target.value)}
              placeholder="Type to search or add"
              className="h-9 text-sm"
            />
            {filteredArtists.length > 0 ?
              <ul className="mt-1 flex max-h-40 min-w-0 flex-col gap-0.5 overflow-y-auto">
                {filteredArtists.map((a) => (
                  <li key={a.artist_id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setArtist(a.artist)
                        setArtistQuery("")
                      }}
                      className="min-h-11 w-full min-w-0 truncate rounded px-2 py-2 text-left text-sm hover:bg-white/10"
                    >
                      {a.artist}
                    </button>
                  </li>
                ))}
              </ul>
            : artistQuery.trim() !== "" ?
              <p className="mt-1 m-0 text-xs text-white/55">
                Will add “{artistQuery.trim()}” as a new artist.
              </p>
            : null}
          </>
        }
      </div>

      <div className="flex min-w-0 flex-col">
        <span className={LABEL_CLS}>Category</span>
        <ToggleGroup
          type="single"
          value={category}
          onValueChange={(v) => {
            if (v === "Unreleased / Miscellaneous" || v === "Cover Songs") {
              setCategory(v)
            }
          }}
          variant="outline"
          size="sm"
          className="w-full flex-wrap justify-stretch"
        >
          {BRAINS_NEW_SONG_CATEGORIES.map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              className="min-h-11 min-w-0 flex-1 text-xs"
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          Back
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => void handleSave()}
          disabled={!canSave}
        >
          {saving ? "Adding…" : "Add song"}
        </Button>
      </div>
    </div>
  )
}
