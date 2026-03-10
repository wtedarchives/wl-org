"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { useListsData, type List } from "@/hooks/use-lists-data"

function ListCard({ list }: { list: List }) {
  return (
    <Link
      href={`/dpro/lists/${list.list_id}`}
      className="block h-full min-h-0"
    >
      <Card className="h-full flex flex-col border-border/60 bg-card/80 overflow-hidden transition-colors hover:bg-muted/40 py-2">
        <CardHeader className="py-0.5">
          <CardTitle className="text-xs font-medium">{list.list_name}</CardTitle>
        </CardHeader>
        {list.list_description?.trim() && (
          <CardContent className="py-0.5">
            <p className="text-[11px] text-muted-foreground leading-tight">
              {list.list_description}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}

function ListSection({
  title,
  lists,
  emptyMessage,
}: {
  title: string
  lists: List[]
  emptyMessage: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {lists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
          {lists.map((list) => (
            <ListCard key={list.list_id} list={list} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  )
}

export function ListsContent() {
  const { songLists, showLists, loading, error } = useListsData()

  useEffect(() => {
    document.title = "Lists – Wysteria Lane"
    return () => {
      document.title = ""
    }
  }, [])

  if (loading) {
    return <LoadingPageCard message="Loading lists…" />
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-center text-sm text-muted-foreground">
            Trouble loading lists. Please reload the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
      <div className="flex flex-col gap-6">
        <ListSection
          title="Songs"
          lists={songLists}
          emptyMessage="No song lists available"
        />
        <ListSection
          title="Shows"
          lists={showLists}
          emptyMessage="No show lists available"
        />
      </div>
    </div>
  )
}
