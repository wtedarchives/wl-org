"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { GameShow } from "@/hooks/use-setlist-game-show-data"
import type { WysteriaSession } from "@/lib/jwt"

interface ShowPicksSectionProps {
  show: GameShow
  user: WysteriaSession | null
  userSubmission: string | null
  onMakePicks: () => void
}

export function ShowPicksSection({
  show,
  user,
  userSubmission,
  onMakePicks,
}: ShowPicksSectionProps) {
  return (
    <Card className="border-border/60 bg-card/80 py-0">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold">Make Picks</CardTitle>
      </CardHeader>
      <CardContent className="py-4 text-center">
        {show.isSelectionClosed ? (
          <>
            <p className="text-sm font-medium text-foreground mb-1">
              Picks are closed for this show.
            </p>
            <p className="text-xs text-muted-foreground">
              Check back later to see results after the setlist has been scored.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground mb-2">
              Show is open for picks.
            </p>
            {user ? (
              <Button variant="outline" size="sm" onClick={onMakePicks}>
                {userSubmission ? "Edit Picks" : "Make Picks"}
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href="/login" className="no-underline hover:underline">Login to Play</Link>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
