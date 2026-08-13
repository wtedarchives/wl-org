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
 * Look up a song, or add one that just debuted.
 *
 * Two schema facts shape this form:
 *   - `songs.song_originalartist` is NOT NULL with a foreign key onto
 *     `artists(artist)`, so the artist is required and must be picked from the
 *     existing list. A song whose artist is missing needs the artist adding first,
 *     which is what the Artists panel next door is for.
 *   - `songs.song` is the primary key. Adding a duplicate title fails on the
 *     constraint rather than creating a second row, which is why the lookup sits
 *     above the form.
 *
 * Display name is written silently to match the title, per spec — there is no
 * separate field for it.
 */
export function BrainsAddSong() {
  const { session } = useAuth()
  const token = session?.token ?? null
  const { songs, artists, categories, refresh } = useBrainsOptions()

  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [artistQuery, setArtistQuery] = useState("")
  const [category, setCategory] = useState("")
  const [saving, setSaving] = useState(false)

  const filteredArtists = useMemo(() => {
    const q = artistQuery.trim().toLowerCase()
    if (q === "") return artists.slice(0, 20)
    return artists
      .filter((a) => a.artist.toLowerCase().includes(q))
      .slice(0, 20)
  }, [artistQuery, artists])

  const trimmedTitle = title.trim()
  const duplicate = useMemo(
    () =>
      trimmedTitle !== "" &&
      songs.some((s) => s.song.toLowerCase() === trimmedTitle.toLowerCase()),
    [songs, trimmedTitle],
  )

  const canSave = trimmedTitle !== "" && artist !== "" && !duplicate && !saving

  const handleAdd = async () => {
    if (!token || !canSave) return
    setSaving(true)
    try {
      const { error } = await invokeDproAdmin(token, {
        action: "songs_insert",
        row: {
          song: trimmedTitle,
          // Mirrors the title. Not surfaced as its own field.
          song_displayname: trimmedTitle,
          song_originalartist: artist,
          song_category: category === "" ? null : category,
        },
      })
      if (error) throw new Error(error)
      toast.success(`Added ${trimmedTitle}.`)
      setTitle("")
      setArtist("")
      setArtistQuery("")
      setCategory("")
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the song.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <BrainsLookup
        items={songs}
        keyOf={(s) => s.song_id}
        labelOf={(s) => s.song}
        placeholder="Search songs"
        renderDetail={(s) => (
          <dl className="flex min-w-0 flex-col gap-0.5 text-[11px] text-white/70">
            <div className="flex gap-1">
              <dt className={LABEL_CLS}>Artist</dt>
              <dd className="min-w-0 break-words">
                {s.song_originalartist ?? "—"}
              </dd>
            </div>
            <div className="flex gap-1">
              <dt className={LABEL_CLS}>Category</dt>
              <dd className="min-w-0 break-words">{s.song_category ?? "—"}</dd>
            </div>
          </dl>
        )}
      />

      <div className="flex min-w-0 flex-col gap-2 border-t border-white/10 pt-3">
        <span className={LABEL_CLS}>Add a song</span>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Song title"
          className="h-8 text-xs"
        />
        {duplicate && (
          <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-amber-200/80">
            Already in the archive
          </p>
        )}

        {artist === "" ? (
          <>
            <Input
              value={artistQuery}
              onChange={(e) => setArtistQuery(e.target.value)}
              placeholder="Original artist (required)"
              className="h-8 text-xs"
            />
            {artistQuery.trim() !== "" && (
              <ul className="flex max-h-40 min-w-0 flex-col gap-0.5 overflow-y-auto">
                {filteredArtists.map((a) => (
                  <li key={a.artist_id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setArtist(a.artist)
                        setArtistQuery("")
                      }}
                      className="w-full min-w-0 truncate rounded px-2 py-1 text-left text-xs hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
                    >
                      {a.artist}
                    </button>
                  </li>
                ))}
                {filteredArtists.length === 0 && (
                  <li className={LABEL_CLS}>
                    No such artist — add it in Artists first
                  </li>
                )}
              </ul>
            )}
          </>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs">{artist}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={() => setArtist("")}
            >
              Change
            </Button>
          </div>
        )}

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-8 min-w-0 rounded border border-white/15 bg-transparent px-2 text-xs"
          aria-label="Category"
        >
          <option value="" className="text-black">
            Category (optional)
          </option>
          {categories.map((c) => (
            <option key={c} value={c} className="text-black">
              {c}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="wl-home-v2-tours-header-pill self-start"
          disabled={!canSave}
          onClick={() => void handleAdd()}
        >
          {saving ? "Adding…" : "Add song"}
        </Button>
      </div>
    </div>
  )
}
