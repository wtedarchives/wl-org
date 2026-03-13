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
    <Card className="rounded-xl border border-wl-dark-grey/50 bg-wl-dark-grey/40 py-0 text-xs shadow-sm ring-0">
      <CardHeader className="border-b border-wl-dark-grey/50 py-2">
        <CardTitle className="text-[13px] font-semibold text-wl-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center px-3 py-6 text-[11px] text-wl-white/70">
            Loading shows…
          </div>
        ) : shows.length === 0 ? (
          <div className="px-3 py-3 text-center text-[11px] text-wl-white/70">
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
