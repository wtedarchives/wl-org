"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ListChecks } from "lucide-react"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"

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

  if (changes.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 py-0">
        <CardContent className="p-3">
          <p className="text-xs font-medium text-foreground">Show Changes</p>
          <p className="text-xs text-muted-foreground mt-1">No changes recorded.</p>
        </CardContent>
      </Card>
    )
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
              className="h-7 gap-1 text-[10px] px-1.5"
              onClick={onOpenModal}
            >
              <ListChecks className="size-3" />
              View all
            </Button>
          )}
        </div>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {changes.slice(0, 3).map((c) => (
            <li key={c.show_change_uuid} className="line-clamp-2">
              <span className="font-medium text-foreground">{c.change_type}:</span>{" "}
              {c.change}
            </li>
          ))}
          {changes.length > 3 && (
            <li className="text-muted-foreground/80">
              +{changes.length - 3} more
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
