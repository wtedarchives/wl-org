"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileMusic } from "lucide-react"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"
import { getChangeTypeIcon } from "./setlist-show-change-icon"

interface SetlistShowChangesCardProps {
  changes: ShowChangeRow[]
  loading: boolean
  onOpenModal?: () => void
}

export function SetlistShowChangesCard({
  changes,
  loading,
  onOpenModal,
}: SetlistShowChangesCardProps) {
  if (loading) {
    return (
      <Card className="border-border/60 bg-card/80 py-0">
        <CardContent className="p-3">
          <p className="text-xs font-medium text-foreground">Show Changes</p>
          <p className="text-xs text-muted-foreground mt-1">Loading…</p>
        </CardContent>
      </Card>
    )
  }

  const hasScan = !!onOpenModal
  if (changes.length === 0 && !hasScan) {
    return null
  }

  return (
    <Card className="border-border/60 bg-card/80 py-0">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-medium text-foreground">Show Changes</p>
          {onOpenModal && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-[10px] px-1.5 hover:!bg-muted"
              onClick={onOpenModal}
            >
              <FileMusic className="size-3" />
              Setlist Scan
            </Button>
          )}
        </div>
        {changes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No changes from original setlist.
          </p>
        ) : (
          <ul className="space-y-1 text-xs text-white/80 [&_a]:font-semibold [&_a]:text-wl-orange [&_a]:hover:underline">
            {changes.map((c) => {
              const iconConfig = getChangeTypeIcon(c.change_type)
              return (
                <li
                  key={c.show_change_uuid}
                  className="flex items-start gap-1.5 line-clamp-2"
                >
                  {iconConfig && (
                    <iconConfig.Icon
                      className={`size-3.5 shrink-0 mt-[1px] ${iconConfig.colorClass}`}
                    />
                  )}
                  <span dangerouslySetInnerHTML={{ __html: c.change }} />
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
