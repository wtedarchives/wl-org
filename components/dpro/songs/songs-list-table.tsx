"use client"

import { useId, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Filter,
  Search,
} from "lucide-react"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SONGS_LIST_PERFORMER_GROUPS } from "@/lib/songs-performer-groups"
import { cn } from "@/lib/utils"

type SongRow = {
  song: string
  song_displayname?: string | null
  song_category: string
  song_originalartist: string
  song_id: string
}

type SortKey = "song" | "song_category" | "song_originalartist"

const ORIGINAL_ARTIST_EMPTY = "__none__"

function originalArtistKey(row: SongRow): string {
  const t = row.song_originalartist?.trim()
  return t ? row.song_originalartist : ORIGINAL_ARTIST_EMPTY
}

function originalArtistLabel(key: string): string {
  return key === ORIGINAL_ARTIST_EMPTY ? "—" : key
}

function ColumnMultiSelectFilter({
  options,
  selected,
  onSelectedChange,
  title,
  ariaLabel,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onSelectedChange: (values: string[]) => void
  title: string
  ariaLabel: string
}) {
  const baseId = useId()
  const [open, setOpen] = useState(false)
  const active = selected.length > 0

  const toggle = (value: string) => {
    onSelectedChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    )
  }

  const clear = () => {
    onSelectedChange([])
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            "h-8 w-8 shrink-0 transition-colors duration-200 hover:bg-muted/80",
            active && "text-primary"
          )}
          aria-label={ariaLabel}
          aria-pressed={active}
        >
          <Filter className="size-3.5" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(18rem,calc(100vw-2rem))] p-0"
        align="start"
      >
        <div className="border-b border-border px-3 py-2">
          <p className="text-xs font-medium text-foreground">{title}</p>
        </div>
        <ul
          className="max-h-[min(50vh,16rem)] overflow-y-auto overscroll-contain p-2"
          role="listbox"
          aria-multiselectable
        >
          {options.map((opt, i) => {
            const id = `${baseId}-${i}`
            const checked = selected.includes(opt.value)
            return (
              <li key={opt.value} role="option" aria-selected={checked}>
                <label
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs transition-colors duration-200 hover:bg-muted/60 sm:py-1.5"
                >
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={() => toggle(opt.value)}
                  />
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                </label>
              </li>
            )
          })}
        </ul>
        {active ? (
          <div className="border-t border-border p-2 transition-colors duration-200">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-full text-xs sm:h-8"
              onClick={clear}
            >
              Clear filter
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

interface SongsListTableProps {
  songs: SongRow[]
  performerBySong: Record<string, string[]>
  categoryOptions: string[]
  onOpenSongSearch: () => void
}

export function SongsListTable({
  songs,
  performerBySong,
  categoryOptions,
  onOpenSongSearch,
}: SongsListTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("song")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  const artistOptions = useMemo(() => {
    const keys = new Set<string>()
    for (const s of songs) {
      keys.add(originalArtistKey(s))
    }
    return [...keys].sort((a, b) => {
      if (a === ORIGINAL_ARTIST_EMPTY) return 1
      if (b === ORIGINAL_ARTIST_EMPTY) return -1
      return a.localeCompare(b)
    })
  }, [songs])

  const performerFilterOptions = useMemo(
    () =>
      [...SONGS_LIST_PERFORMER_GROUPS].sort((a, b) => a.localeCompare(b)).map(
        (g) => ({ value: g, label: g })
      ),
    []
  )

  const categoryFilterItems = useMemo(
    () => categoryOptions.map((c) => ({ value: c, label: c })),
    [categoryOptions]
  )

  const artistFilterItems = useMemo(
    () =>
      artistOptions.map((key) => ({
        value: key,
        label: originalArtistLabel(key),
      })),
    [artistOptions]
  )

  const filteredSongs = useMemo(() => {
    return songs.filter((row) => {
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(row.song_category)
      ) {
        return false
      }
      if (selectedArtists.length > 0) {
        const key = originalArtistKey(row)
        if (!selectedArtists.includes(key)) return false
      }
      if (selectedGroups.length > 0) {
        const pills = performerBySong[row.song] ?? []
        if (!pills.some((g) => selectedGroups.includes(g))) return false
      }
      return true
    })
  }, [
    songs,
    selectedCategories,
    selectedArtists,
    selectedGroups,
    performerBySong,
  ])

  const sorted = useMemo(() => {
    const mult = sortDir === "asc" ? 1 : -1
    return [...filteredSongs].sort((a, b) => {
      let cmp = 0
      if (sortKey === "song") {
        cmp = a.song.localeCompare(b.song)
      } else if (sortKey === "song_category") {
        cmp = a.song_category.localeCompare(b.song_category)
      } else {
        cmp = a.song_originalartist.localeCompare(b.song_originalartist)
      }
      return cmp * mult
    })
  }, [filteredSongs, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const SortToggle = ({
    colKey,
    label,
    className,
  }: {
    colKey: SortKey
    label: string
    className?: string
  }) => {
    const active = sortKey === colKey
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 min-h-8 gap-1 px-2 font-medium text-foreground transition-colors duration-200 hover:bg-muted/80",
          className
        )}
        onClick={() => toggleSort(colKey)}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="size-3.5 shrink-0 opacity-80" />
          ) : (
            <ArrowDown className="size-3.5 shrink-0 opacity-80" />
          )
        ) : (
          <ArrowUpDown className="size-3.5 shrink-0 opacity-40" />
        )}
      </Button>
    )
  }

  return (
    <div className="min-w-0 w-full rounded-lg border border-border/60 bg-card/80 shadow-sm">
      <Table className="w-max min-w-full table-auto">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-auto whitespace-nowrap py-1 align-middle">
              <div className="flex min-w-0 flex-nowrap items-center gap-0.5">
                <SortToggle colKey="song" label="Song" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 shrink-0 transition-colors duration-200 hover:bg-muted/80"
                  aria-label="Search songs"
                  onClick={onOpenSongSearch}
                >
                  <Search className="size-3.5" aria-hidden />
                </Button>
              </div>
            </TableHead>
            <TableHead className="h-auto whitespace-nowrap py-1 align-middle">
              <div className="flex min-w-0 flex-nowrap items-center gap-0.5">
                <SortToggle colKey="song_category" label="Category" />
                <ColumnMultiSelectFilter
                  options={categoryFilterItems}
                  selected={selectedCategories}
                  onSelectedChange={setSelectedCategories}
                  title="Categories"
                  ariaLabel="Filter by category"
                />
              </div>
            </TableHead>
            <TableHead className="h-auto whitespace-nowrap py-1 align-middle">
              <div className="flex min-w-0 flex-nowrap items-center gap-0.5">
                <SortToggle
                  colKey="song_originalartist"
                  label="Original artist"
                />
                <ColumnMultiSelectFilter
                  options={artistFilterItems}
                  selected={selectedArtists}
                  onSelectedChange={setSelectedArtists}
                  title="Original artists"
                  ariaLabel="Filter by original artist"
                />
              </div>
            </TableHead>
            <TableHead className="h-auto whitespace-nowrap px-2 py-1 align-middle">
              <div className="flex min-w-0 flex-nowrap items-center gap-0.5">
                <span className="flex h-8 min-h-8 items-center px-1 text-xs/relaxed font-medium text-foreground">
                  Performed by
                </span>
                <ColumnMultiSelectFilter
                  options={performerFilterOptions}
                  selected={selectedGroups}
                  onSelectedChange={setSelectedGroups}
                  title="Performed by"
                  ariaLabel="Filter by performer group"
                />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => {
            const pills = performerBySong[row.song] ?? []
            return (
              <TableRow key={row.song_id}>
                <TableCell className="px-2 py-0.5 align-middle font-medium whitespace-nowrap">
                  <Link
                    href={`/archive/song/${row.song_id}`}
                    className="inline-block whitespace-nowrap text-foreground hover:underline"
                  >
                    <SongDisplayName
                      song={row.song}
                      songDisplayName={row.song_displayname}
                    />
                  </Link>
                </TableCell>
                <TableCell className="px-2 py-0.5 align-middle whitespace-nowrap text-muted-foreground">
                  {row.song_category}
                </TableCell>
                <TableCell className="px-2 py-0.5 align-middle whitespace-nowrap text-muted-foreground">
                  {row.song_originalartist || "—"}
                </TableCell>
                <TableCell className="px-2 py-0.5 align-middle whitespace-nowrap">
                  {pills.length > 0 ? (
                    <div className="flex flex-nowrap items-center gap-1">
                      {pills.map((g) => (
                        <Badge
                          key={g}
                          variant="secondary"
                          className="shrink-0 text-[0.65rem] font-normal"
                        >
                          {g}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
