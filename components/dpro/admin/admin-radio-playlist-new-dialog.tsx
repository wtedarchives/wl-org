"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Loader2Icon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW,
  type WtedEpisodeRadioSyncRow,
} from "@/lib/wted-episodes-radio-sync"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SaveNewPlaylistEpisodePayload = {
  episode: string
  display_name: string | null
  show: string
  order: number | null
  artwork: string | null
  host: string | null
  host_displayname: string | null
  status: string | null
}

function parseOrderInput(raw: string): number | null {
  const t = raw.trim()
  if (t === "") return null
  const n = Number.parseInt(t, 10)
  return Number.isFinite(n) ? n : null
}

function mergeShowOptions(
  loaded: string[],
  currentShow: string | null | undefined,
): string[] {
  const set = new Set(loaded)
  if (currentShow && currentShow.trim()) set.add(currentShow.trim())
  set.add(WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW)
  return [...set].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  )
}

export function NewPlaylistEditDialog({
  row,
  open,
  onOpenChange,
  onSave,
  updating,
}: {
  row: WtedEpisodeRadioSyncRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (
    uuid: string,
    payload: SaveNewPlaylistEpisodePayload,
  ) => Promise<boolean>
  updating: boolean
}) {
  const [showSlugs, setShowSlugs] = useState<string[]>([])
  const [loadingShows, setLoadingShows] = useState(false)

  const [episode, setEpisode] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [show, setShow] = useState<string>(WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW)
  const [orderStr, setOrderStr] = useState("")
  const [artwork, setArtwork] = useState("")
  const [host, setHost] = useState("")
  const [hostDisplayname, setHostDisplayname] = useState("")
  const [status, setStatus] = useState("NEW")

  const loadShows = useCallback(async () => {
    if (!supabase) return
    setLoadingShows(true)
    try {
      const { data, error } = await supabase
        .from("wted_shows")
        .select("show")
        .order("order", { ascending: true, nullsFirst: false })
      if (error) throw error
      const slugs = (data ?? []).map((r) => r.show).filter(Boolean)
      setShowSlugs(slugs)
    } catch {
      setShowSlugs([WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW])
    } finally {
      setLoadingShows(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    loadShows()
  }, [open, loadShows])

  useEffect(() => {
    if (!row) return
    setEpisode(row.episode)
    setDisplayName(row.display_name ?? "")
    setShow(row.show?.trim() || WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW)
    setOrderStr(row.order != null ? String(row.order) : "")
    setArtwork(row.artwork ?? "")
    setHost(row.host ?? "")
    setHostDisplayname(row.host_displayname ?? "")
    setStatus(row.status?.trim() || "NEW")
  }, [row])

  const showOptions = mergeShowOptions(showSlugs, row?.show)

  const handleSave = async () => {
    if (!row || updating) return
    const ep = episode.trim()
    if (!ep) return
    const ok = await onSave(row.uuid, {
      episode: ep,
      display_name: displayName.trim() || null,
      show: show.trim() || WTED_EPISODE_RADIO_SYNC_DEFAULT_SHOW,
      order: parseOrderInput(orderStr),
      artwork: artwork.trim() || null,
      host: host.trim() || null,
      host_displayname: hostDisplayname.trim() || null,
      status: status.trim() || null,
    })
    if (ok) onOpenChange(false)
  }

  const artworkPreview =
    artwork.trim().startsWith("http") ? artwork.trim() : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-lg"
        showCloseButton={!updating}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit episode</DialogTitle>
          <DialogDescription>
            Update this row in{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              wted_episodes
            </code>
            . Radio ID stays fixed (sync key).
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <div className="flex flex-col gap-4 text-sm transition-all duration-200">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">radio_id</Label>
              <p className="rounded-md border bg-muted/30 px-2 py-1.5 font-mono text-xs">
                {row.radio_id}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="playlist-episode">episode</Label>
              <Input
                id="playlist-episode"
                value={episode}
                onChange={(e) => setEpisode(e.target.value)}
                disabled={updating}
                className="min-h-10 md:min-h-9"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="playlist-display-name">display_name</Label>
              <Input
                id="playlist-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={updating}
                className="min-h-10 md:min-h-9"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="playlist-show">show</Label>
              <Select
                value={show}
                onValueChange={setShow}
                disabled={updating || loadingShows}
              >
                <SelectTrigger
                  id="playlist-show"
                  className="min-h-10 w-full md:min-h-9"
                >
                  <SelectValue placeholder="Select show" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[min(20rem,50vh)]">
                  {showOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="playlist-order">order</Label>
              <Input
                id="playlist-order"
                inputMode="numeric"
                value={orderStr}
                onChange={(e) => setOrderStr(e.target.value)}
                disabled={updating}
                placeholder="Optional"
                className="min-h-10 md:min-h-9"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="playlist-artwork">artwork (URL)</Label>
              <Input
                id="playlist-artwork"
                value={artwork}
                onChange={(e) => setArtwork(e.target.value)}
                disabled={updating}
                placeholder="https://…"
                className="min-h-10 md:min-h-9"
                autoComplete="off"
              />
              {artworkPreview ? (
                <div className="relative mt-2 h-28 w-28 overflow-hidden rounded-md border bg-muted transition-opacity duration-200">
                  <Image
                    src={artworkPreview}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="112px"
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="playlist-host">host</Label>
              <Input
                id="playlist-host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                disabled={updating}
                className="min-h-10 md:min-h-9"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="playlist-host-display">host_displayname</Label>
              <Input
                id="playlist-host-display"
                value={hostDisplayname}
                onChange={(e) => setHostDisplayname(e.target.value)}
                disabled={updating}
                className="min-h-10 md:min-h-9"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="playlist-status">status</Label>
              <Input
                id="playlist-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={updating}
                placeholder="NEW, or leave empty for NULL"
                className="min-h-10 md:min-h-9"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Clear the field and save to store NULL in the database.
              </p>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            className="min-h-11 w-full touch-manipulation bg-green-600 text-white hover:bg-green-700 sm:min-h-10 sm:w-auto dark:bg-green-600 dark:hover:bg-green-700"
            disabled={updating || !row || !episode.trim()}
            onClick={handleSave}
          >
            {updating ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
