"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Rows3, Ungroup } from "lucide-react"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { SongsListTable } from "@/components/dpro/songs/songs-list-table"
import { SongSearch } from "@/components/dpro/songs/song-search"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import {
  type SongsArchiveCategory,
  type SongsArchiveSong,
  useSongsArchiveData,
} from "@/hooks/use-songs-archive-data"
import { cn } from "@/lib/utils"

function CategorySection({
  sectionCategories,
  title,
  songsByCategory,
}: {
  sectionCategories: SongsArchiveCategory[]
  title: string
  songsByCategory: Record<string, SongsArchiveSong[]>
}) {
  if (sectionCategories.length === 0) return null

  const isCoverSongs = title === "Cover Songs"
  const containerClass = isCoverSongs
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start"
    : "columns-1 gap-x-4 md:columns-2 lg:columns-3 xl:columns-4 space-y-4"

  return (
    <div className="mb-8 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className={containerClass}>
        {sectionCategories.map((category, index) => {
          const categorySongs = songsByCategory[category.category] ?? []
          const isFirstCoverCard =
            isCoverSongs && sectionCategories.length > 1 && index === 0
          const isSecondCoverCard =
            isCoverSongs && sectionCategories.length > 1 && index === 1
          const cardClass = isFirstCoverCard
            ? "col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 overflow-hidden rounded-lg border border-border/60 bg-background/70 shadow-sm py-0"
            : isSecondCoverCard
              ? "col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 overflow-hidden rounded-lg border border-border/60 bg-background/70 shadow-sm py-0"
              : "overflow-hidden rounded-lg border border-border/60 bg-background/70 shadow-sm py-0 break-inside-avoid"

          return (
            <Card
              key={category.category}
              className={cardClass}
            >
                  <div className="bg-muted/60 px-4 py-2 flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-sm font-medium truncate pr-2">
                      {category.category}
                    </CardTitle>
                    {category.category_artwork?.trim() && (
                      <span className="shrink-0 size-5 relative rounded overflow-hidden border border-border">
                        <Image
                          src={category.category_artwork}
                          alt=""
                          width={20}
                          height={20}
                          className="size-5 object-cover"
                          unoptimized
                        />
                      </span>
                    )}
                  </div>
                  <CardContent className="p-0">
                    <ul
                      className={
                        title === "Cover Songs"
                          ? "grid grid-cols-1 sm:grid-cols-2 gap-0"
                          : ""
                      }
                    >
                      {categorySongs.map((song) => (
                        <li
                          key={song.song_id}
                          className="border-t border-border/40 bg-background/70 hover:bg-muted/40 transition-colors"
                        >
                          <Link
                            href={`/archive/song/${song.song_id}`}
                            className="block py-0.5 pl-3 text-xs font-medium text-foreground hover:underline"
                          >
                            <SongDisplayName
                              song={song.song}
                              songDisplayName={song.song_displayname}
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
          )
        })}
      </div>
    </div>
  )
}

export function SongsContent() {
  const [songSearchOpen, setSongSearchOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view =
    searchParams.get("view") === "list" ? "list" : "categories"

  const setView = useCallback(
    (next: "categories" | "list") => {
      const p = new URLSearchParams(searchParams.toString())
      if (next === "categories") {
        p.delete("view")
      } else {
        p.set("view", "list")
      }
      const q = p.toString()
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const { categories, songs, performerBySong, loading, error } =
    useSongsArchiveData()

  useEffect(() => {
    document.title = "Songs – WysteriaLane.org"
    return () => {
      document.title = ""
    }
  }, [])

  const songsByCategory = useMemo(() => {
    const grouped: Record<string, SongsArchiveSong[]> = {}
    categories.forEach((category) => {
      const categorySongs = songs.filter(
        (song) => song.song_category === category.category,
      )
      const sorted = [...categorySongs].sort((a, b) => {
        if (a.song_categoryorder !== b.song_categoryorder) {
          return a.song_categoryorder - b.song_categoryorder
        }
        return a.song.localeCompare(b.song)
      })
      grouped[category.category] = sorted
    })
    return grouped
  }, [songs, categories])

  const listSongsSorted = useMemo(() => {
    return [...songs].sort((a, b) => a.song.localeCompare(b.song))
  }, [songs])

  const categoryFilterOptions = useMemo(
    () => categories.map((c) => c.category),
    [categories]
  )

  const sectionedCategories = useMemo(() => {
    const sorted = [...categories].sort(
      (a, b) => a.category_canonid - b.category_canonid,
    )
    const studioReleases = sorted.filter((c) => c.category_canonid <= 20)
    const liveOnlySongs = sorted.filter(
      (c) =>
        (c.category_canonid >= 21 && c.category_canonid <= 170) ||
        c.category_canonid === 298,
    )
    const tedTapesSongs = sorted.filter(
      (c) => c.category_canonid >= 171 && c.category_canonid <= 297,
    )
    const coverSongs = sorted.filter(
      (c) => c.category_canonid === 299 || c.category_canonid === 300,
    )
    const sideProjects = sorted.filter((c) => c.category_canonid > 300)
    return {
      studioReleases,
      liveOnlySongs,
      tedTapesSongs,
      coverSongs,
      sideProjects,
    }
  }, [categories])

  if (loading) {
    return <LoadingPageCard message="Loading songs data…" />
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-center text-sm text-muted-foreground">
            Trouble finding songs. Please reload the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
      <div className="mb-1 w-full">
        <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm py-0">
          <div className="bg-muted/60 flex min-w-0 flex-nowrap items-center gap-2 px-2 py-1.5 sm:px-3">
            <h1 className="shrink-0 text-sm font-semibold">Songs</h1>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <ButtonGroup className="shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  title="Categories"
                  aria-label="Categories"
                  className={cn(
                    "border-border px-2 text-xs text-foreground transition-colors hover:!bg-card/50 sm:px-3",
                    view === "categories"
                      ? "bg-muted/50"
                      : "bg-transparent"
                  )}
                  onClick={() => setView("categories")}
                >
                  <Ungroup className="size-4 shrink-0 md:hidden" aria-hidden />
                  <span className="hidden md:inline">Categories</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  title="List"
                  aria-label="List"
                  className={cn(
                    "border-border px-2 text-xs text-foreground transition-colors hover:!bg-card/50 sm:px-3",
                    view === "list" ? "bg-muted/50" : "bg-transparent"
                  )}
                  onClick={() => setView("list")}
                >
                  <Rows3 className="size-4 shrink-0 md:hidden" aria-hidden />
                  <span className="hidden md:inline">List</span>
                </Button>
              </ButtonGroup>
              <SongSearch
                className="shrink-0"
                open={songSearchOpen}
                onOpenChange={setSongSearchOpen}
              />
            </div>
          </div>
        </Card>
      </div>
      <div className="pb-8 w-full min-w-0">
        {view === "list" ? (
          <SongsListTable
            songs={listSongsSorted}
            performerBySong={performerBySong}
            categoryOptions={categoryFilterOptions}
            onOpenSongSearch={() => setSongSearchOpen(true)}
          />
        ) : (
          <>
            <CategorySection
              sectionCategories={sectionedCategories.studioReleases}
              title="Studio Releases"
              songsByCategory={songsByCategory}
            />
            <CategorySection
              sectionCategories={sectionedCategories.liveOnlySongs}
              title="Live-Only Songs"
              songsByCategory={songsByCategory}
            />
            <CategorySection
              sectionCategories={sectionedCategories.tedTapesSongs}
              title="Ted Tapes Songs/Jams"
              songsByCategory={songsByCategory}
            />
            <CategorySection
              sectionCategories={sectionedCategories.coverSongs}
              title="Cover Songs"
              songsByCategory={songsByCategory}
            />
            <CategorySection
              sectionCategories={sectionedCategories.sideProjects}
              title="Side Projects"
              songsByCategory={songsByCategory}
            />
          </>
        )}
      </div>
    </div>
  )
}
