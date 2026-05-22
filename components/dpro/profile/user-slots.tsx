"use client"

import { useEffect, useId, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { TourSlotsTable } from "@/components/dpro/tours/tour-slots-table"
import { WlHomeV2UserSongModal } from "@/components/wl-home-v2/wl-home-v2-user-song-modal"
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
  const [songModalOpen, setSongModalOpen] = useState(false)
  const [songModalSongName, setSongModalSongName] = useState<string | null>(null)
  const [songModalSongDisplayName, setSongModalSongDisplayName] = useState<
    string | null
  >(null)
  const [songModalSongId, setSongModalSongId] = useState<string | null>(null)
  const userSongModalHeadingId = useId()
  const userSongModalScopeLineId = useId()

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
    setSongModalSongName(songName)
    setSongModalSongDisplayName(
      songDisplayName ?? songDisplayNameMap[songName] ?? null,
    )
    setSongModalSongId(songIdMap[songName] ?? null)
    setSongModalOpen(true)
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

      <WlHomeV2UserSongModal
        open={songModalOpen}
        onClose={() => setSongModalOpen(false)}
        headingId={userSongModalHeadingId}
        scopeLineId={userSongModalScopeLineId}
        songName={songModalSongName}
        songDisplayName={songModalSongDisplayName}
        songId={songModalSongId}
        userId={effectiveUserId}
        attendedShowIds={attendedShowIds}
        isOwnProfile={isOwnProfile}
      />
    </>
  )
}
