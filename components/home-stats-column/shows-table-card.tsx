"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody } from "@/components/ui/table"
import { useShowMetadata } from "@/hooks/use-show-metadata"
import { type HomeShow } from "@/hooks/use-shows-data"
import { ShowRow } from "./show-row"

export function ShowsTableCard({
  title,
  shows,
  loading,
  emptyMessage,
}: {
  title: string
  shows: HomeShow[]
  loading: boolean
  emptyMessage?: string
}) {
  const { showsWithSetlists, showsWithReleases } = useShowMetadata(
    shows,
    new Date().getFullYear().toString(),
  )

  return (
    <Card className="bg-card/95 text-xs shadow-sm">
      <CardHeader className="border-b border-border/40 py-2">
        <CardTitle className="text-[13px] font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center px-3 py-6 text-[11px] text-muted-foreground">
            Loading shows…
          </div>
        ) : shows.length === 0 ? (
          <div className="px-3 py-3 text-center text-[11px] text-muted-foreground">
            {emptyMessage ?? "No shows found."}
          </div>
        ) : (
          <Table className="text-[11px]">
            <TableBody>
              {shows.map((show) => (
                <ShowRow
                  key={show.show_id}
                  show={show}
                  showsWithSetlists={showsWithSetlists}
                  showsWithReleases={showsWithReleases}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
