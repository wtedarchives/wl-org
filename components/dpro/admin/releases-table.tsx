"use client"

import { Plus } from "@phosphor-icons/react"
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
    <div className="wl-home-v2-archive-admin-show-releases">
      <div className="wl-home-v2-archive-admin-song-form__head">
        <div
          role="heading"
          aria-level={3}
          className="wl-home-v2-archive-admin-song-form__section-label"
        >
          Releases
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddRelease}
          className="wl-home-v2-tours-header-pill shrink-0 gap-1"
        >
          <Plus className="size-3.5 shrink-0 opacity-80" aria-hidden />
          Add release
        </Button>
      </div>
      {loadingReleases ?
        <div className="wl-home-v2-archive-admin-show-releases__loading">
          <div className="wl-home-v2-archive-admin-show-releases__loading-dots">
            <div className="wl-home-v2-archive-admin-show-releases__loading-dot" />
            <div className="wl-home-v2-archive-admin-show-releases__loading-dot" />
            <div className="wl-home-v2-archive-admin-show-releases__loading-dot" />
          </div>
          <p className="wl-home-v2-archive-admin-show-releases__loading-text">
            Loading releases...
          </p>
        </div>
      : showReleases.length > 0 ?
        <div className="wl-home-v2-archive-admin-show-releases__table-shell">
          <Table className="set-table">
            <TableHeader>
              <TableRow>
                <TableHead className="wl-home-v2-archive-admin-show-releases__th">
                  Display Name
                </TableHead>
                <TableHead className="wl-home-v2-archive-admin-show-releases__th">
                  Service
                </TableHead>
                <TableHead
                  className={
                    "wl-home-v2-archive-admin-show-releases__th " +
                    "wl-home-v2-archive-admin-show-releases__th--center"
                  }
                >
                  Order
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showReleases.map((releaseShow) => (
                <TableRow
                  key={releaseShow.release_id}
                  className="wl-home-v2-archive-admin-show-releases__row"
                  onClick={() =>
                    onEditRelease(
                      releaseShow.release_id,
                      releaseShow.release_order
                    )
                  }
                >
                  <TableCell className="wl-home-v2-archive-admin-show-releases__cell">
                    {releaseShow.releases.release_displayname}
                  </TableCell>
                  <TableCell className="wl-home-v2-archive-admin-show-releases__cell">
                    {releaseShow.releases.release_service ?? "-"}
                  </TableCell>
                  <TableCell
                    className={
                      "wl-home-v2-archive-admin-show-releases__cell " +
                      "wl-home-v2-archive-admin-show-releases__cell--center"
                    }
                  >
                    {releaseShow.release_order}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      : <div className="wl-home-v2-archive-admin-show-releases__empty">
          No releases associated with this show
        </div>
      }
    </div>
  )
}
