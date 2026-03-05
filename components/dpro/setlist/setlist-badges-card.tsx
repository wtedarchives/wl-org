"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Show } from "@/types/setlist"

interface SetlistBadgesCardProps {
  show: Show
}

export function SetlistBadgesCard({ show }: SetlistBadgesCardProps) {
  const hasCategory = !!show.show_listcategorycomplete
  const hasJive = show.show_jivecomplete === true
  const hasDripfield = show.show_dripfieldcomplete === true

  if (!hasCategory && !hasJive && !hasDripfield) {
    return (
      <Card className="border-border/60 bg-card/80 py-0">
        <CardContent className="p-3">
          <p className="text-xs font-medium text-foreground">Badges</p>
          <p className="text-xs text-muted-foreground mt-1">None</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 py-0">
      <CardContent className="p-3">
        <p className="text-xs font-medium text-foreground mb-2">Badges</p>
        <div className="flex flex-wrap gap-1">
          {hasCategory && (
            <Badge variant="secondary" className="text-[10px]">
              Category
            </Badge>
          )}
          {hasJive && (
            <Badge variant="secondary" className="text-[10px]">
              JOTY
            </Badge>
          )}
          {hasDripfield && (
            <Badge variant="secondary" className="text-[10px]">
              Dripfield
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
