"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { UserPersonnelTable } from "@/components/dpro/profile/user-personnel-table"
import { UserPersonnelShowsSheet } from "@/components/dpro/profile/user-personnel-shows-sheet"
import { useUserGuests } from "@/hooks/use-user-guests"
import { useUserShows } from "@/hooks/use-user-shows"
import { getUserGuestsMessages } from "@/lib/utils/user-guests-messages"

const CATEGORY_ORDER = [
  "Goose (current)",
  "Goose (former)",
  "Guest",
  "Group",
]

interface UserPersonnelProps {
  userId?: string | null
  effectiveUserId: string | null
  isOwnProfile: boolean
}

export function UserPersonnel({
  userId,
  effectiveUserId,
  isOwnProfile,
}: UserPersonnelProps) {
  const [username, setUsername] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetGuestName, setSheetGuestName] = useState<string | null>(null)
  const [sheetGuestId, setSheetGuestId] = useState<string | null>(null)

  const { shows } = useUserShows(effectiveUserId)
  const attendedShowIds = useMemo(
    () => shows.map((s) => s.show_id),
    [shows]
  )

  const {
    loading,
    loadingProgress,
    guestsByCategory,
    error,
  } = useUserGuests(effectiveUserId)

  const handlePersonnelClick = (guestName: string, guestId: string) => {
    setSheetGuestName(guestName)
    setSheetGuestId(guestId)
    setSheetOpen(true)
  }

  useEffect(() => {
    if (!isOwnProfile && userId && supabase) {
      supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single()
        .then(({ data, error: fetchError }) => {
          if (!fetchError && data?.username) {
            setUsername(data.username)
          }
        })
    }
  }, [userId, isOwnProfile])

  const {
    getLoadingMessage,
    getErrorMessage,
    getEmptyStateMessage,
  } = getUserGuestsMessages(isOwnProfile, username, error)

  if (!effectiveUserId) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            Please log in to see personnel stats.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <LoadingPageCard
        message={getLoadingMessage()}
        progress={loadingProgress}
      />
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-sm text-destructive">
            {getErrorMessage()}
          </p>
        </CardContent>
      </Card>
    )
  }

  const sortedCategories = Object.keys(guestsByCategory)
    .filter((cat) => guestsByCategory[cat].guests.length > 0)
    .sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a)
      const indexB = CATEGORY_ORDER.indexOf(b)
      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      return a.localeCompare(b)
    })

  if (sortedCategories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-sm text-muted-foreground">
            {getEmptyStateMessage()}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
        <div className="border-b border-border/60 bg-muted/60 px-3 py-2">
          <h2 className="text-sm font-semibold">Musicians Seen</h2>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedCategories.map((category) => (
              <div key={category} className="min-h-[200px]">
                <UserPersonnelTable
                  category={category}
                  guests={guestsByCategory[category].guests}
                  count={guestsByCategory[category].count}
                  onPersonnelClick={handlePersonnelClick}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <UserPersonnelShowsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        guestName={sheetGuestName}
        guestId={sheetGuestId}
        attendedShowIds={attendedShowIds}
        isOwnProfile={isOwnProfile}
      />
    </>
  )
}
