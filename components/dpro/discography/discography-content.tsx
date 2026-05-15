"use client"

import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import Link from "next/link"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import {
  type DiscographyArchiveIndexRow,
  buildDiscographyRowsByCategory,
  discographyRowLinkLabel,
} from "@/lib/discography-archive-index"
import {
  discographyCategoriesByColumn,
  discographyIndexColumnCount,
} from "@/lib/discography-index-layout"
import { useDiscographyArchiveIndexData } from "@/hooks/use-discography-archive-index-data"
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

const DISCOGRAPHY_INDEX_TITLE = "Discography – WTEDRadio.com"

function DiscographyCategoryCard({
  category,
  categoryItems,
}: {
  category: string
  categoryItems: DiscographyArchiveIndexRow[]
}) {
  return (
    <Card className="min-w-0 overflow-hidden py-0">
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
                        {discographyRowLinkLabel(item, category)}
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
}

export function DiscographyContent() {
  const { items, loading, error: fetchError, progress } =
    useDiscographyArchiveIndexData()
  const [columnCount, setColumnCount] = useState(1)

  useEffect(() => {
    document.title = DISCOGRAPHY_INDEX_TITLE
  }, [])

  useLayoutEffect(() => {
    const update = () => {
      setColumnCount(discographyIndexColumnCount(window.innerWidth))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const byCategory = useMemo(
    () => buildDiscographyRowsByCategory(items),
    [items],
  )

  const columns = useMemo(
    () => discographyCategoriesByColumn(columnCount),
    [columnCount],
  )

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
      <div className="flex min-w-0 flex-row items-start gap-4">
        {columns.map((categoriesInColumn, colIndex) => (
          <div
            key={colIndex}
            className="flex min-w-0 flex-1 flex-col gap-4"
          >
            {categoriesInColumn.map((category) => (
              <DiscographyCategoryCard
                key={category}
                category={category}
                categoryItems={byCategory.get(category) ?? []}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
