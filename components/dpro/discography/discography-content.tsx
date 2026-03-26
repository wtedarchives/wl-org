"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import {
  DISCOGRAPHY_PUBLIC_CATEGORIES,
} from "@/lib/discography-public"
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { getDiscographyArchiveUrl } from "@/lib/discography-archive-url"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"

type DiscographyListRow = {
  uuid: string
  displayname: string
  artwork: string | null
  canon_id: number
  category: string
}

const DISCOGRAPHY_INDEX_TITLE = "Discography – WysteriaLane.org"

export function DiscographyContent() {
  const [items, setItems] = useState<DiscographyListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    document.title = DISCOGRAPHY_INDEX_TITLE
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) {
      setLoading(false)
      setFetchError(true)
      return
    }

    let cancelled = false

    async function load(sb: SupabaseClient) {
      setLoading(true)
      setFetchError(false)
      setProgress(10)
      const cats = [...DISCOGRAPHY_PUBLIC_CATEGORIES]
      const { data, error } = await sb
        .from("discography")
        .select("uuid, displayname, artwork, canon_id, category")
        .in("category", cats)
        .order("canon_id", { ascending: true })

      if (cancelled) return

      setProgress(100)
      if (error) {
        console.error("Error loading discography:", error)
        setFetchError(true)
        setItems([])
      } else {
        setItems((data ?? []) as DiscographyListRow[])
      }
      setLoading(false)
    }

    void load(client)
    return () => {
      cancelled = true
    }
  }, [])

  const byCategory = useMemo(() => {
    const map = new Map<string, DiscographyListRow[]>()
    for (const c of DISCOGRAPHY_PUBLIC_CATEGORIES) {
      map.set(c, [])
    }
    for (const item of items) {
      const list = map.get(item.category)
      if (list) list.push(item)
    }
    const sideProjects = map.get("Side Projects")
    if (sideProjects?.length) {
      sideProjects.sort((a, b) =>
        a.displayname.localeCompare(b.displayname, undefined, {
          sensitivity: "base",
        }),
      )
    }
    return map
  }, [items])

  if (loading) {
    return (
      <LoadingPageCard
        message="Loading discography data…"
        progress={progress}
      />
    )
  }

  if (fetchError) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-b-none p-4 md:rounded-b-xl md:p-6">
        <Card className="border-border/60 bg-card/80 py-0 overflow-hidden">
          <CardContent className="py-8 px-6 text-center text-sm text-muted-foreground">
            Could not load discography. Try again later.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-b-none p-4 md:rounded-b-xl md:p-6">
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 min-[1024px]:grid-cols-2 min-[1280px]:grid-cols-3 min-[1440px]:grid-cols-4 min-[1860px]:grid-cols-5">
        {DISCOGRAPHY_PUBLIC_CATEGORIES.map((category) => {
          const categoryItems = byCategory.get(category) ?? []
          return (
            <Card key={category} className="min-w-0 overflow-hidden py-0">
              <CardHeader className="min-w-0 bg-muted/60 py-2">
                <CardTitle className="text-sm font-medium break-words">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="min-w-0 p-0 [&_[data-slot=table-container]]:overflow-x-hidden">
                {categoryItems.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No items found
                  </div>
                ) : (
                  <Table className="table-fixed">
                    <TableBody>
                      {categoryItems.map((item) => (
                        <TableRow key={item.uuid}>
                          <TableCell className="max-w-0 py-1 pl-3 pr-2 align-middle whitespace-normal">
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                href={getDiscographyArchiveUrl(item.uuid)}
                                className="min-w-0 flex-1 text-xs font-medium leading-3.5 text-foreground hover:underline break-words [overflow-wrap:anywhere]"
                              >
                                {item.displayname}
                              </Link>
                              {item.artwork ? (
                                <span className="inline-block w-max max-w-5 shrink-0">
                                  <img
                                    src={item.artwork}
                                    alt=""
                                    className="block h-auto max-h-5 w-auto max-w-5 rounded border border-border object-contain"
                                    onError={(e) => {
                                      const el = e.target as HTMLImageElement
                                      if (el) el.style.display = "none"
                                    }}
                                  />
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}