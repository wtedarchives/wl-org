"use client"

import {
  BookOpen,
  Calendar,
  ChartBar,
  LineSegments,
  ListNumbers,
  MagnifyingGlass,
  MapPin,
  MusicNote,
  UserCircle,
  Users,
  VinylRecord,
} from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import { type ComponentType, useId } from "react"

import {
  ARCHIVE_ENTRIES,
  ARCHIVE_INTRO,
  type ArchiveEntry,
} from "@/lib/archive-hub-content"
import { WlHomeV2ArchiveYearsSelector } from "@/components/wl-home-v2/wl-home-v2-archive-years-selector"
import { WlHomeV2SetlistGameAlert } from "@/components/wl-home-v2/wl-home-v2-setlist-game-alert"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useUserProfilePicture } from "@/hooks/use-user-profile-picture"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { archiveV2NavHref } from "@/lib/archive-v2-nav-href"
import { cn } from "@/lib/utils"

type PhosphorTileIcon = ComponentType<{
  className?: string
  size?: number
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"
  "aria-hidden"?: boolean
}>

const ARCHIVE_ICONS: Record<string, PhosphorTileIcon> = {
  Calendar,
  LineSegments,
  MapPin,
  Music: MusicNote,
  BarChart3: ChartBar,
  Users,
  Disc3: VinylRecord,
  ListMusic: ListNumbers,
  UserCircle,
  BookOpen,
}

const ICON_PROPS = {
  size: 22,
  weight: "regular" as const,
}

type WlHomeV2ArchiveModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
  /** Opens site search (closes this hub first when provided). */
  onOpenSiteSearch?: () => void
}

const YEARS_ENTRY = ARCHIVE_ENTRIES.find((entry) => entry.title === "Years")

function ArchiveModalYearsRow({
  onClose,
  className,
}: {
  onClose: () => void
  className?: string
}) {
  if (!YEARS_ENTRY) return null

  return (
    <div className={cn("modal-archive-hub-years", className)}>
      <div className="modal-archive-hub-years-head">
        <div className="modal-archive-hub-years-heading">
          <span className="modal-archive-hub-years-title">{YEARS_ENTRY.title}</span>
          <p className="modal-archive-hub-years-desc">{YEARS_ENTRY.description}</p>
        </div>
        <Calendar
          className="modal-archive-tile-icon modal-archive-hub-years-icon"
          {...ICON_PROPS}
          aria-hidden
        />
      </div>
      <WlHomeV2ArchiveYearsSelector onNavigate={onClose} />
    </div>
  )
}

function ArchiveModalTile({
  entry,
  myStatsProfile,
}: {
  entry: ArchiveEntry
  myStatsProfile: ReturnType<typeof useUserProfilePicture> | null
}) {
  const Icon = ARCHIVE_ICONS[entry.icon]
  const isMyStats = entry.title === "My Stats"
  const showMyStatsPhoto =
    isMyStats &&
    myStatsProfile?.profileSignedIn &&
    Boolean(myStatsProfile.profilePicture) &&
    !myStatsProfile.profilePhotoLoadFailed

  return (
    <Link
      href={archiveV2NavHref(entry.href)}
      className="modal-archive-tile"
    >
      <span className="modal-archive-tile-top">
        <span className="modal-archive-tile-title">{entry.title}</span>
        {isMyStats && myStatsProfile ?
          showMyStatsPhoto ?
            <img
              src={myStatsProfile.profilePicture!}
              alt={myStatsProfile.profilePhotoAlt}
              className="modal-archive-tile-avatar"
              width={22}
              height={22}
              decoding="async"
              onError={() => myStatsProfile.setProfilePhotoLoadFailed(true)}
            />
          : <Image
              src="/icon-myprofile.png"
              alt=""
              width={22}
              height={22}
              className="modal-archive-tile-avatar modal-archive-tile-avatar--default"
            />
        : Icon ?
          <Icon
            className="modal-archive-tile-icon"
            {...ICON_PROPS}
            aria-hidden
          />
        : null}
      </span>
      <span className="modal-archive-tile-desc">{entry.description}</span>
    </Link>
  )
}

export function WlHomeV2ArchiveModal({
  open,
  onClose,
  headingId,
  onOpenSiteSearch,
}: WlHomeV2ArchiveModalProps) {
  const descId = useId()
  const myStatsProfile = useUserProfilePicture()
  useWlHomeV2ScrollLock(open)

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="archive-hub-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--archive-hub"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={descId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>{ARCHIVE_INTRO.title}</h3>
              <p id={descId} className="modal-request-sub">
                {ARCHIVE_INTRO.description}
              </p>
            </div>
            <div className="modal-request-head-trailing">
              {onOpenSiteSearch ?
                <button
                  type="button"
                  className="wl-home-v2-site-search-icon-trigger wl-home-v2-site-search-icon-trigger--labeled"
                  aria-haspopup="dialog"
                  aria-label="Search archive"
                  onClick={onOpenSiteSearch}
                >
                  <MagnifyingGlass
                    className="wl-home-v2-site-search-icon-trigger__icon"
                    size={22}
                    weight="regular"
                    aria-hidden
                  />
                  <span className="wl-home-v2-site-search-icon-trigger__label">
                    Search
                  </span>
                </button>
              : null}
              <button
                type="button"
                className="modal-request-close"
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
          <div className="modal-request-body modal-archive-hub-body">
            <ArchiveModalYearsRow
              className="modal-archive-hub-years--above-grid"
              onClose={onClose}
            />
            <div className="modal-archive-hub-grid">
              <ArchiveModalYearsRow
                className="modal-archive-hub-years--in-grid"
                onClose={onClose}
              />
              {ARCHIVE_ENTRIES.filter(
                (entry) => entry.title !== "Submit" && entry.title !== "Years",
              ).map((entry) => (
                <ArchiveModalTile
                  key={entry.title}
                  entry={entry}
                  myStatsProfile={
                    entry.title === "My Stats" ? myStatsProfile : null
                  }
                />
              ))}
            </div>
            <div className="modal-archive-hub-footer">
              <WlHomeV2SetlistGameAlert className="modal-archive-hub-setlist-game-alert" />
              <div className="modal-archive-hub-submit">
                <p className="modal-archive-hub-submit-text">
                  Have setlist corrections, new shows, or other archive data to
                  contribute?{" "}
                  <br
                    className="modal-archive-hub-submit-text-linebreak"
                    aria-hidden
                  />
                  Use the Submit form to help keep the archive accurate and up
                  to date.
                </p>
                <Link
                  href="/archive/submit"
                  className="modal-archive-hub-submit-cta"
                  onClick={onClose}
                >
                  Submit & contribute
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
