"use client"

import { Suspense } from "react"

import { SubmitModalHandler } from "@/components/submit-modal-handler"

import { WlHomeV2ArchiveModal } from "./wl-home-v2-archive-modal"
import { WlHomeV2FollowUsModal } from "./wl-home-v2-follow-us-modal"
import { WlHomeV2ForgotPasswordModal } from "./wl-home-v2-forgot-password-modal"
import { WlHomeV2LoginModal } from "./wl-home-v2-login-modal"
import { WlHomeV2RadioModal } from "./wl-home-v2-radio-modal"
import { WlHomeV2RadioScheduleShareExportModal } from "./wl-home-v2-radio-schedule-share-export-modal"
import { WlHomeV2RecentlyPlayedModal } from "./wl-home-v2-recently-played-modal"
import { WlHomeV2RequestModal } from "./wl-home-v2-request-modal"
import { WlHomeV2ScheduleModal } from "./wl-home-v2-schedule-modal"
import { WlHomeV2SettingsModal } from "./wl-home-v2-settings-modal"
import { WlHomeV2SignupModal } from "./wl-home-v2-signup-modal"
import { WlHomeV2SiteSearchModal } from "./wl-home-v2-site-search-modal"
import { WlHomeV2ThisDayHistoryModal } from "./wl-home-v2-this-day-history-modal"
import { WlHomeV2TourScheduleModal } from "./wl-home-v2-tour-schedule-modal"

export type WlHomeV2ShellModalsProps = {
  requestOpen: boolean
  setRequestOpen: (open: boolean) => void
  requestHeadingId: string
  recentlyPlayedOpen: boolean
  setRecentlyPlayedOpen: (open: boolean) => void
  recentlyPlayedHeadingId: string
  scheduleOpen: boolean
  setScheduleOpen: (open: boolean) => void
  scheduleHeadingId: string
  tourScheduleOpen: boolean
  setTourScheduleOpen: (open: boolean) => void
  tourScheduleHeadingId: string
  thisDayHistoryOpen: boolean
  setThisDayHistoryOpen: (open: boolean) => void
  thisDayHistoryHeadingId: string
  loginOpen: boolean
  setLoginOpen: (open: boolean) => void
  loginHeadingId: string
  forgotOpen: boolean
  setForgotOpen: (open: boolean) => void
  forgotHeadingId: string
  signupOpen: boolean
  setSignupOpen: (open: boolean) => void
  signupHeadingId: string
  archiveOpen: boolean
  closeArchiveModal: () => void
  archiveHeadingId: string
  onOpenSiteSearchFromArchive?: () => void
  siteSearchOpen: boolean
  setSiteSearchOpen: (open: boolean) => void
  siteSearchHeadingId: string
  siteSearchAllowed: boolean
  radioOpen: boolean
  setRadioOpen: (open: boolean) => void
  radioHeadingId: string
  showRadioScheduleShare: boolean
  radioScheduleShareOpen: boolean
  setRadioScheduleShareOpen: (open: boolean) => void
  radioScheduleShareBg: string
  followUsOpen: boolean
  setFollowUsOpen: (open: boolean) => void
  followUsHeadingId: string
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  settingsHeadingId: string
}

export function WlHomeV2ShellModals({
  requestOpen,
  setRequestOpen,
  requestHeadingId,
  recentlyPlayedOpen,
  setRecentlyPlayedOpen,
  recentlyPlayedHeadingId,
  scheduleOpen,
  setScheduleOpen,
  scheduleHeadingId,
  tourScheduleOpen,
  setTourScheduleOpen,
  tourScheduleHeadingId,
  thisDayHistoryOpen,
  setThisDayHistoryOpen,
  thisDayHistoryHeadingId,
  loginOpen,
  setLoginOpen,
  loginHeadingId,
  forgotOpen,
  setForgotOpen,
  forgotHeadingId,
  signupOpen,
  setSignupOpen,
  signupHeadingId,
  archiveOpen,
  closeArchiveModal,
  archiveHeadingId,
  onOpenSiteSearchFromArchive,
  siteSearchOpen,
  setSiteSearchOpen,
  siteSearchHeadingId,
  siteSearchAllowed,
  radioOpen,
  setRadioOpen,
  radioHeadingId,
  showRadioScheduleShare,
  radioScheduleShareOpen,
  setRadioScheduleShareOpen,
  radioScheduleShareBg,
  followUsOpen,
  setFollowUsOpen,
  followUsHeadingId,
  settingsOpen,
  setSettingsOpen,
  settingsHeadingId,
}: WlHomeV2ShellModalsProps) {
  return (
    <>
      <WlHomeV2RequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        headingId={requestHeadingId}
      />
      <WlHomeV2RecentlyPlayedModal
        open={recentlyPlayedOpen}
        onClose={() => setRecentlyPlayedOpen(false)}
        headingId={recentlyPlayedHeadingId}
      />
      <WlHomeV2ScheduleModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        headingId={scheduleHeadingId}
      />
      <WlHomeV2TourScheduleModal
        open={tourScheduleOpen}
        onClose={() => setTourScheduleOpen(false)}
        headingId={tourScheduleHeadingId}
      />
      <WlHomeV2ThisDayHistoryModal
        open={thisDayHistoryOpen}
        onClose={() => setThisDayHistoryOpen(false)}
        headingId={thisDayHistoryHeadingId}
      />
      <WlHomeV2ArchiveModal
        open={archiveOpen}
        onClose={closeArchiveModal}
        headingId={archiveHeadingId}
        onOpenSiteSearch={onOpenSiteSearchFromArchive}
      />
      {siteSearchAllowed ?
        <WlHomeV2SiteSearchModal
          open={siteSearchOpen}
          onClose={() => setSiteSearchOpen(false)}
          headingId={siteSearchHeadingId}
        />
      : null}
      <WlHomeV2RadioModal
        open={radioOpen}
        onClose={() => setRadioOpen(false)}
        headingId={radioHeadingId}
        onRequestSong={() => setRequestOpen(true)}
      />
      <WlHomeV2RadioScheduleShareExportModal
        open={showRadioScheduleShare && radioScheduleShareOpen}
        onOpenChange={setRadioScheduleShareOpen}
        backgroundSrc={radioScheduleShareBg}
      />
      <WlHomeV2FollowUsModal
        open={followUsOpen}
        onClose={() => setFollowUsOpen(false)}
        headingId={followUsHeadingId}
      />
      <WlHomeV2SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        headingId={settingsHeadingId}
      />
      <Suspense fallback={null}>
        <SubmitModalHandler />
      </Suspense>
      <WlHomeV2LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        headingId={loginHeadingId}
        onOpenForgotPassword={() => {
          setLoginOpen(false)
          setForgotOpen(true)
        }}
        onOpenSignUp={() => {
          setLoginOpen(false)
          setSignupOpen(true)
        }}
      />
      <WlHomeV2ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        headingId={forgotHeadingId}
        onBackToLogin={() => {
          setForgotOpen(false)
          setLoginOpen(true)
        }}
      />
      <WlHomeV2SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        headingId={signupHeadingId}
        onBackToLogin={() => {
          setSignupOpen(false)
          setLoginOpen(true)
        }}
      />
    </>
  )
}
