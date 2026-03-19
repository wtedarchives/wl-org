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
  icon,
}: {
  title: string
  shows: HomeShow[]
  loading: boolean
  emptyMessage?: string
  icon?: React.ReactNode
}) {
  const { showsWithSetlists, showsWithReleases } = useShowMetadata(
    shows,
    new Date().getFullYear().toString(),
  )

  return (
    <Card className="rounded-xl border border-wl-dark-grey/50 bg-[#313a34] py-0 text-xs shadow-sm ring-0">
      <CardHeader className="border-b border-wl-dark-grey/50 py-2 bg-black/30">
        <div className="flex flex-row items-center justify-between gap-2 min-w-0">
          <CardTitle className="shrink-0 text-[13px] font-semibold text-wl-white">
            {title}
          </CardTitle>
          {icon ? <span className="shrink-0 text-wl-white/80">{icon}</span> : null}
        </div>
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
