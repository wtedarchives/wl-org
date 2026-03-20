"use client"

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { SongSearch } from "@/components/dpro/songs/song-search"
import { supabase } from "@/lib/supabase"

interface Song {
  song: string
  song_displayname?: string | null
  song_category: string
  song_originalartist: string
  song_id: string
  song_categoryorder: number
}

interface Category {
  category: string
  category_canonid: number
  category_display_name: string
  category_color1: string
  category_color2: string
  category_artwork: string
  category_type: string
}

const BATCH_SIZE = 1000

function CategorySection({
  sectionCategories,
  title,
  songsByCategory,
}: {
  sectionCategories: Category[]
  title: string
  songsByCategory: Record<string, Song[]>
}) {
  if (sectionCategories.length === 0) return null

  const isCoverSongs = title === "Cover Songs"
  const containerClass = isCoverSongs
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start"
    : "columns-1 gap-x-4 md:columns-2 lg:columns-3 xl:columns-4 space-y-4"

  return (
    <div className="mb-8 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className={containerClass}>
        {sectionCategories.map((category, index) => {
          const categorySongs = songsByCategory[category.category] ?? []
          const isSecondCoverCard =
            isCoverSongs && sectionCategories.length > 1 && index === 1
          const cardClass = isSecondCoverCard
            ? "col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-3 overflow-hidden rounded-lg border border-border/60 bg-background/70 shadow-sm py-0"
            : "overflow-hidden rounded-lg border border-border/60 bg-background/70 shadow-sm py-0 break-inside-avoid"

          return (
            <Card
              key={category.category}
              className={cardClass}
            >
                  <CardHeader className="bg-muted/60 py-2 flex flex-row items-center justify-between gap-2">
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
                  </CardHeader>
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
                            className="block py-0.5 pl-3 text-xs font-medium text-foreground underline-offset-4 hover:underline"
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
  const [categories, setCategories] = useState<Category[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    document.title = "Songs – Wysteria Lane"
    return () => {
      document.title = ""
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setError(true)
      return
    }
    const db = supabase

    async function fetchData() {
      setLoading(true)
      setError(false)
      try {
        const { data: categoriesData, error: catError } = await db
          .from("categories")
          .select("*")
          .order("category_canonid", { ascending: true })

        if (catError) throw catError

        const { count, error: countError } = await db
          .from("songs")
          .select("*", { count: "exact", head: true })
          .eq("song_placeholder", false)

        if (countError) throw countError

        const totalBatches = Math.ceil((count ?? 0) / BATCH_SIZE)
        let allSongsData: Song[] = []

        for (let i = 0; i < totalBatches; i++) {
          const start = i * BATCH_SIZE
          const end = Math.min(start + BATCH_SIZE - 1, (count ?? 0) - 1)

          const { data, error: batchError } = await db
            .from("songs")
            .select("*")
            .eq("song_placeholder", false)
            .order("song_categoryorder", { ascending: true })
            .range(start, end)

          if (batchError) throw batchError
          if (data) allSongsData = [...allSongsData, ...data]
        }

        setSongs(allSongsData)
        setCategories((categoriesData as Category[]) ?? [])
      } catch {
        setError(true)
        setSongs([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const songsByCategory = useMemo(() => {
    const grouped: Record<string, Song[]> = {}
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
          <div className="bg-muted/60 px-3 py-1.5 flex justify-between items-center gap-2">
            <h1 className="text-sm font-semibold">Songs</h1>
            <SongSearch />
          </div>
        </Card>
      </div>
      <div className="pb-8 w-full">
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
      </div>
    </div>
  )
}
