"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { UserPersonnelListTable } from "@/components/dpro/profile/user-personnel-table"
import { WlHomeV2GuestAppearancesModal } from "@/components/wl-home-v2/wl-home-v2-guest-appearances-modal"
import { useUserGuests } from "@/hooks/use-user-guests"
import { useUserShows } from "@/hooks/use-user-shows"
import { type GuestAppearancesModalData } from "@/hooks/use-guest-appearances"
import { getUserGuestsMessages } from "@/lib/utils/user-guests-messages"
import {
  fetchGuestAppearanceShowsForShows,
  fetchGuestInstrumentFromDb,
} from "@/lib/guest-appearance-detail-fetch"
import { cn } from "@/lib/utils"
import type { GuestsByCategory, UserGuest } from "@/types/user-guests"

import "./user-personnel.css"

const PANEL_TITLE_CURRENT_GOOSE = "Current Goose Members"
const PANEL_TITLE_FORMER_GOOSE = "Former Goose Members"

const GUEST_SUBHEADER_GUESTS = "Guests"
const GUEST_SUBHEADER_GROUPS = "Groups"
const GOOSE_CURRENT = "Goose (current)"
const GOOSE_FORMER = "Goose (former)"
const GUEST = "Guest"
const GROUP = "Group"

const BUILTIN_CATEGORIES = new Set([
  GOOSE_CURRENT,
  GOOSE_FORMER,
  GUEST,
  GROUP,
])

const EMPTY_GUEST_MODAL: GuestAppearancesModalData = {
  isOpen: false,
  guestId: "",
  guestName: "",
  guestInstrument: null,
  songs: [],
  tourName: "",
}

interface UserPersonnelProps {
  userId?: string | null
  effectiveUserId: string | null
  isOwnProfile: boolean
}

function PersonnelMessage({
  children,
  tone = "muted",
}: {
  children: ReactNode
  tone?: "muted" | "danger"
}) {
  return (
    <div className="wl-profile-personnel-root">
      <p
        className={cn(
          "wl-profile-personnel-message",
          tone === "danger" && "text-red-400/90 border-red-900/50",
        )}
      >
        {children}
      </p>
    </div>
  )
}

function PersonnelPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "widget-panel wl-profile-personnel-panel min-w-0",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function UserPersonnel({
  userId,
  effectiveUserId,
  isOwnProfile,
}: UserPersonnelProps) {
  const [username, setUsername] = useState<string | null>(null)
  const [guestModal, setGuestModal] =
    useState<GuestAppearancesModalData>(EMPTY_GUEST_MODAL)

  const { shows } = useUserShows(effectiveUserId)
  const attendedShowIds = useMemo(
    () => shows.map((s) => s.show_id),
    [shows],
  )

  const { loading, loadingProgress, guestsByCategory, error } =
    useUserGuests(effectiveUserId)

  const closeGuestModal = () =>
    setGuestModal((p) => ({ ...p, isOpen: false }))

  const handlePersonnelClick = async (guestName: string, guestId: string) => {
    if (attendedShowIds.length === 0) return
    try {
      const [personnelShows, guestInstrument] = await Promise.all([
        fetchGuestAppearanceShowsForShows(guestId, attendedShowIds),
        fetchGuestInstrumentFromDb(guestId),
      ])
      setGuestModal({
        isOpen: true,
        guestId,
        guestName,
        guestInstrument,
        songs: [],
        tourName:
          isOwnProfile ? "Your attended shows" : "Attended shows",
        personnelShows,
      })
    } catch (err) {
      console.error("Error loading guest appearances:", err)
    }
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

  const { getLoadingMessage, getErrorMessage, getEmptyStateMessage } =
    getUserGuestsMessages(isOwnProfile, username, error)

  const guestsPanel = useMemo(
    () => buildGuestsBucket(guestsByCategory),
    [guestsByCategory],
  )

  const hasPersonnelData = useMemo(() => {
    const g = guestsByCategory
    if (Object.keys(g).length === 0) return false
    return Object.values(g).some((c) => c.guests.length > 0)
  }, [guestsByCategory])

  if (!effectiveUserId) {
    return (
      <PersonnelMessage>
        Please log in to see personnel stats.
      </PersonnelMessage>
    )
  }

  if (loading) {
    return (
      <div className="wl-profile-personnel-root w-full">
        <WlWidgetPanelLoading
          message={getLoadingMessage()}
          progress={loadingProgress}
        />
      </div>
    )
  }

  if (error) {
    return (
      <PersonnelMessage tone="danger">
        {getErrorMessage()}
      </PersonnelMessage>
    )
  }

  if (!hasPersonnelData) {
    return (
      <PersonnelMessage>
        {getEmptyStateMessage()}
      </PersonnelMessage>
    )
  }

  const currentGoose = guestsByCategory[GOOSE_CURRENT]?.guests ?? []
  const formerGoose = guestsByCategory[GOOSE_FORMER]?.guests ?? []

  const {
    hasAny: guestsPanelHasRows,
    guestArtists,
    groups,
    otherSections,
  } = guestsPanel

  return (
    <>
      <div className="wl-profile-personnel-root wl-profile-personnel-grid">
        {currentGoose.length > 0 ?
          <PersonnelPanel>
            <UserPersonnelListTable
              nameColumnHeader={PANEL_TITLE_CURRENT_GOOSE}
              guests={currentGoose}
              onPersonnelClick={handlePersonnelClick}
              wlHomeV2
            />
          </PersonnelPanel>
        : null}

        {formerGoose.length > 0 ?
          <PersonnelPanel>
            <UserPersonnelListTable
              nameColumnHeader={PANEL_TITLE_FORMER_GOOSE}
              guests={formerGoose}
              onPersonnelClick={handlePersonnelClick}
              wlHomeV2
            />
          </PersonnelPanel>
        : null}

        {guestsPanelHasRows ?
          <PersonnelPanel className="md:col-span-2 lg:col-span-1">
            <div className="flex flex-col gap-5 px-0 pb-3 pt-1 min-w-0">
              {guestArtists.length > 0 ?
                <div className="wl-profile-personnel-subblock">
                  <UserPersonnelListTable
                    nameColumnHeader={GUEST_SUBHEADER_GUESTS}
                    guests={guestArtists}
                    onPersonnelClick={handlePersonnelClick}
                    wlHomeV2
                  />
                </div>
              : null}
              {groups.length > 0 ?
                <div className="wl-profile-personnel-subblock">
                  <UserPersonnelListTable
                    nameColumnHeader={GUEST_SUBHEADER_GROUPS}
                    guests={groups}
                    onPersonnelClick={handlePersonnelClick}
                    wlHomeV2
                  />
                </div>
              : null}
              {otherSections.map(({ label, guests: rows }) => (
                <div key={label} className="wl-profile-personnel-subblock">
                  <UserPersonnelListTable
                    nameColumnHeader={label}
                    guests={rows}
                    onPersonnelClick={handlePersonnelClick}
                    wlHomeV2
                  />
                </div>
              ))}
            </div>
          </PersonnelPanel>
        : null}
      </div>

      <WlHomeV2GuestAppearancesModal
        modalData={guestModal}
        onOpenChange={(open) => {
          if (!open) closeGuestModal()
        }}
      />
    </>
  )
}

function buildGuestsBucket(guestsByCategory: GuestsByCategory): {
  hasAny: boolean
  guestArtists: UserGuest[]
  groups: UserGuest[]
  otherSections: Array<{ label: string; guests: UserGuest[] }>
} {
  const guestArtists = guestsByCategory[GUEST]?.guests ?? []
  const groups = guestsByCategory[GROUP]?.guests ?? []

  const otherKeys = Object.keys(guestsByCategory)
    .filter(
      (k) =>
        !BUILTIN_CATEGORIES.has(k) && guestsByCategory[k].guests.length > 0,
    )
    .sort((a, b) => a.localeCompare(b))

  const otherSections = otherKeys.map((label) => ({
    label,
    guests: guestsByCategory[label].guests,
  }))

  const hasAny =
    guestArtists.length > 0 ||
    groups.length > 0 ||
    otherSections.length > 0

  return { hasAny, guestArtists, groups, otherSections }
}
