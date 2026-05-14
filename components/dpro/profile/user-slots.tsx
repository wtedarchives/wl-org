"use client"

import { useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { TourSlotsTable } from "@/components/dpro/tours/tour-slots-table"
import { UserSongPerformancesSheet } from "@/components/dpro/profile/user-song-performances-sheet"
import { useUserSlots } from "@/hooks/use-user-slots"
import type { SlotShowData } from "@/types/tour"
import {
  getSlotsLoadingMessage,
  getSlotsNoUserMessage,
  getSlotsNoShowsMessage,
  getSlotsNoSlotsMessage,
} from "@/lib/utils/user-slots-messages"

import "./user-slots.css"

interface UserSlotsProps {
  userId: string | null
  effectiveUserId: string | null
  isOwnProfile: boolean
}

function SlotsMessage({ children }: { children: ReactNode }) {
  return (
    <div className="wl-profile-slots-root">
      <p className="wl-profile-slots-message">{children}</p>
    </div>
  )
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
    songDisplayName?: string | null,
  ) => {
    setSheetSongName(songName)
    setSheetSongDisplayName(
      songDisplayName ?? songDisplayNameMap[songName] ?? null,
    )
    setSheetSongId(songIdMap[songName] ?? null)
    setSheetOpen(true)
  }

  if (!effectiveUserId) {
    return <SlotsMessage>{getSlotsNoUserMessage(isOwnProfile)}</SlotsMessage>
  }

  if (isLoading) {
    return (
      <div className="wl-profile-slots-root w-full">
        <WlWidgetPanelLoading
          message={getSlotsLoadingMessage(isOwnProfile, username)}
          progress={loadingProgress}
        />
      </div>
    )
  }

  if (attendedShowIds.length === 0) {
    return (
      <SlotsMessage>{getSlotsNoShowsMessage(isOwnProfile, username)}</SlotsMessage>
    )
  }

  if (!hasSlotEntries) {
    return (
      <SlotsMessage>{getSlotsNoSlotsMessage(isOwnProfile, username)}</SlotsMessage>
    )
  }

  if (errorMessage) {
    return <SlotsMessage>{errorMessage}</SlotsMessage>
  }

  return (
    <>
      <div className="wl-profile-slots-root">
        <TourSlotsTable
          slots={slots as SlotShowData[]}
          activeColumns={activeColumns as (keyof SlotShowData)[]}
          onSongClick={handleSongClick}
          wlHomeV2
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
