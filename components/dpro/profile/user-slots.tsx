"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { UserSlotsTable } from "@/components/dpro/profile/user-slots-table"
import { UserSongPerformancesSheet } from "@/components/dpro/profile/user-song-performances-sheet"
import { useUserSlots } from "@/hooks/use-user-slots"
import {
  getSlotsLoadingMessage,
  getSlotsNoUserMessage,
  getSlotsNoShowsMessage,
  getSlotsNoSlotsMessage,
} from "@/lib/utils/user-slots-messages"

interface UserSlotsProps {
  userId: string | null
  effectiveUserId: string | null
  isOwnProfile: boolean
}

export function UserSlots({
  userId,
  effectiveUserId,
  isOwnProfile,
}: UserSlotsProps) {
  const [username, setUsername] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetSongName, setSheetSongName] = useState<string | null>(null)
  const [sheetSongDisplayName, setSheetSongDisplayName] = useState<
    string | null
  >(null)
  const [sheetSongId, setSheetSongId] = useState<string | null>(null)

  const {
    slots,
    activeColumns,
    songIdMap,
    songDisplayNameMap,
    hasSlotEntries,
    attendedShowIds,
    isLoading,
    loadingProgress,
    errorMessage,
  } = useUserSlots(effectiveUserId)

  useEffect(() => {
    if (!isOwnProfile && userId && supabase) {
      supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single()
        .then(({ data, error }) => {
          if (!error && data?.username) {
            setUsername(data.username)
          }
        })
    }
  }, [userId, isOwnProfile])

  const handleSongClick = (
    songName: string,
    songDisplayName?: string | null
  ) => {
    setSheetSongName(songName)
    setSheetSongDisplayName(
      songDisplayName ?? songDisplayNameMap[songName] ?? null
    )
    setSheetSongId(songIdMap[songName] ?? null)
    setSheetOpen(true)
  }

  if (!effectiveUserId) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            {getSlotsNoUserMessage(isOwnProfile)}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <LoadingPageCard
        message={getSlotsLoadingMessage(isOwnProfile, username)}
        progress={loadingProgress}
      />
    )
  }

  if (attendedShowIds.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            {getSlotsNoShowsMessage(isOwnProfile, username)}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!hasSlotEntries) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            {getSlotsNoSlotsMessage(isOwnProfile, username)}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (errorMessage) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="mt-4">
        <UserSlotsTable
          slots={slots}
          activeColumns={activeColumns}
          onSongClick={handleSongClick}
        />
      </div>

      <UserSongPerformancesSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        songName={sheetSongName}
        songDisplayName={sheetSongDisplayName}
        songId={sheetSongId}
        userId={effectiveUserId}
        attendedShowIds={attendedShowIds}
        isOwnProfile={isOwnProfile}
      />
    </>
  )
}
