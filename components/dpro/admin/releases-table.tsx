"use client"

import { Plus } from "lucide-react"
import type { ReleaseShow } from "@/types/admin"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ReleasesTableProps {
  showReleases: ReleaseShow[]
  loadingReleases: boolean
  onAddRelease: () => void
  onEditRelease: (releaseId: string, order: number) => void
}

export function ReleasesTable({
  showReleases,
  loadingReleases,
  onAddRelease,
  onEditRelease,
}: ReleasesTableProps) {
  return (
    <div className="mt-2">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-medium">Releases</h4>
        <Button variant="outline" size="sm" onClick={onAddRelease}>
          <Plus className="size-4" />
          Add Release
        </Button>
      </div>
      {loadingReleases ? (
        <div className="flex items-center justify-center gap-2 p-3">
          <div className="flex gap-2">
            <div className="size-3 animate-pulse rounded-lg bg-muted" />
            <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:150ms]" />
            <div className="size-3 animate-pulse rounded-lg bg-muted [animation-delay:300ms]" />
          </div>
          <p className="ml-2 text-xs text-muted-foreground">
            Loading releases...
          </p>
        </div>
      ) : showReleases.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left text-xs">Display Name</TableHead>
              <TableHead className="text-left text-xs">Service</TableHead>
              <TableHead className="text-center text-xs">Order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showReleases.map((releaseShow) => (
              <TableRow
                key={releaseShow.release_id}
                className="cursor-pointer text-[0.625rem] hover:bg-muted/50"
                onClick={() =>
                  onEditRelease(
                    releaseShow.release_id,
                    releaseShow.release_order
                  )
                }
              >
                <TableCell>
                  {releaseShow.releases.release_displayname}
                </TableCell>
                <TableCell>
                  {releaseShow.releases.release_service ?? "-"}
                </TableCell>
                <TableCell className="text-center">
                  {releaseShow.release_order}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="rounded border border-border bg-background p-3 text-center text-xs text-muted-foreground">
          No releases associated with this show
        </div>
      )}
    </div>
  )
}
