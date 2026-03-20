"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { PersonnelSearch } from "@/components/dpro/personnel/personnel-search"
import { supabase } from "@/lib/supabase"
import { formatInstrument } from "@/lib/personnel-utils"

interface GuestRow {
  guest_id: string
  guest: string
  guest_instrument: string | null
}

const PERSONNEL_CATEGORIES = [
  { key: "current", label: "Current Goose Members", category: "Goose (current)" },
  { key: "former", label: "Former Goose Members", category: "Goose (former)" },
  { key: "guests", label: "Guests", category: "Guest" },
  { key: "groups", label: "Groups", category: "Group" },
] as const

export function PersonnelContent() {
  const [personnelByCategory, setPersonnelByCategory] = useState<
    Record<string, GuestRow[]>
  >({
    current: [],
    former: [],
    guests: [],
    groups: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    document.title = "Personnel – Wysteria Lane"
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
        const result: Record<string, GuestRow[]> = {
          current: [],
          former: [],
          guests: [],
          groups: [],
        }

        for (const { key, category } of PERSONNEL_CATEGORIES) {
          const selectFields =
            key === "groups"
              ? "guest_id, guest, guest_instrument"
              : "guest_id, guest, guest_instrument"

          const { data, error: fetchError } = await db
            .from("guests")
            .select(selectFields)
            .eq("guest_category", category)
            .order("guest", { ascending: true })

          if (fetchError) throw fetchError
          result[key] = (data ?? []).map((row) => ({
            guest_id: row.guest_id,
            guest: row.guest,
            guest_instrument: key === "groups" ? null : row.guest_instrument ?? null,
          }))
        }

        setPersonnelByCategory(result)
      } catch {
        setError(true)
        setPersonnelByCategory({
          current: [],
          former: [],
          guests: [],
          groups: [],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <LoadingPageCard message="Loading personnel data…" />
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-center text-sm text-muted-foreground">
            Trouble finding personnel. Please reload the page.
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
            <h1 className="text-sm font-semibold">Personnel</h1>
            <PersonnelSearch />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 pb-8 items-start">
        {PERSONNEL_CATEGORIES.map(({ key, label }) => {
          const items = personnelByCategory[key] ?? []
          const showInstrument = key !== "groups"

          return (
            <Card
              key={key}
              className="overflow-hidden rounded-lg border border-border/60 bg-background/70 shadow-sm py-0"
            >
              <CardHeader className="bg-muted/60 py-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {items.length === 0 ? (
                  <div className="py-4 px-3 text-center text-xs text-muted-foreground">
                    No entries
                  </div>
                ) : (
                  <ul>
                    {items.map((item) => (
                      <li
                        key={item.guest_id}
                        className="border-t border-border/40 bg-background/70 hover:bg-muted/40 transition-colors"
                      >
                        <Link
                          href={`/archive/personnel/${item.guest_id}`}
                          className="group block py-0.5 pl-3 pr-3 text-xs font-medium text-foreground"
                        >
                          <span className="underline-offset-4 group-hover:underline">
                            {item.guest}
                          </span>
                          {showInstrument && item.guest_instrument && (
                            <span className="ml-2.5 text-[10px] font-normal text-muted-foreground no-underline">
                              {formatInstrument(item.guest_instrument)}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
