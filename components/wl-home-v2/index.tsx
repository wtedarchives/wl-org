"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { SetlistBreadcrumbProvider } from "@/components/setlist-breadcrumb-context"
import { useSetlistAdmin } from "@/hooks/use-setlist-admin"
import { pickRandomShareBackground } from "@/lib/wl-home-v2-share-backgrounds"
import { cn } from "@/lib/utils"

import "./wl-home-v2.css"

import { WlHomeV2ArchiveSubnav } from "./wl-home-v2-archive-subnav"
import { WlHomeV2Footer } from "./wl-home-v2-footer"
import { WlHomeV2Header } from "./wl-home-v2-header"
// Homepage marquee ticker — disabled for now; uncomment import + JSX below to restore.
// import { WlHomeV2HomeTicker } from "./wl-home-v2-home-ticker"
import { SetlistCombinedRowsPreferenceProvider } from "./setlist-combined-rows-preference-context"
import { WlHomeV2OpenArchiveHubContext } from "./wl-home-v2-open-archive-hub-context"
import { WlHomeV2AuthQuerySync } from "./wl-home-v2-auth-query-sync"
import { WlHomeV2AuthModalsContext } from "./wl-home-v2-open-login-context"
import { WlHomeV2OpenSettingsContext } from "./wl-home-v2-open-settings-context"
import { WlHomeV2ShellModals } from "./wl-home-v2-shell-modals"
import { WlHomeV2Tiles } from "./wl-home-v2-tiles"

export function WlHomeV2({
  children,
  archiveModalInitiallyOpen = false,
}: {
  children?: ReactNode
  /** When true (e.g. `/archive` route), open the archive hub modal on mount. */
  archiveModalInitiallyOpen?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { session } = useAuth()
  const { showAdminUi } = useSetlistAdmin(session, undefined, undefined)
  const showRadioScheduleShare = showAdminUi

  const [requestOpen, setRequestOpen] = useState(false)
  const requestHeadingId = useId()

  const [recentlyPlayedOpen, setRecentlyPlayedOpen] = useState(false)
  const recentlyPlayedHeadingId = useId()

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const scheduleHeadingId = useId()

  const [tourScheduleOpen, setTourScheduleOpen] = useState(false)
  const tourScheduleHeadingId = useId()

  const [thisDayHistoryOpen, setThisDayHistoryOpen] = useState(false)
  const thisDayHistoryHeadingId = useId()

  const [loginOpen, setLoginOpen] = useState(false)
  const loginHeadingId = useId()

  const [forgotOpen, setForgotOpen] = useState(false)
  const forgotHeadingId = useId()

  const [signupOpen, setSignupOpen] = useState(false)
  const signupHeadingId = useId()

  const [archiveOpen, setArchiveOpen] = useState(archiveModalInitiallyOpen)
  const archiveHeadingId = useId()

  const [radioOpen, setRadioOpen] = useState(false)
  const radioHeadingId = useId()

  const [radioScheduleShareOpen, setRadioScheduleShareOpen] = useState(false)
  const [radioScheduleShareBg, setRadioScheduleShareBg] = useState(() =>
    pickRandomShareBackground(),
  )

  const [followUsOpen, setFollowUsOpen] = useState(false)
  const followUsHeadingId = useId()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsHeadingId = useId()

  const closeArchiveModal = useCallback(() => {
    setArchiveOpen(false)
    if (pathname === "/archive") {
      router.replace("/")
    }
  }, [pathname, router])

  const openArchiveHub = useCallback(() => {
    setArchiveOpen(true)
  }, [])

  const openLogin = useCallback(() => {
    setLoginOpen(true)
  }, [])

  const openSignup = useCallback(() => {
    setLoginOpen(false)
    setSignupOpen(true)
  }, [])

  const openForgotPassword = useCallback(() => {
    setLoginOpen(false)
    setForgotOpen(true)
  }, [])

  const authModals = useMemo(
    () => ({
      openLogin,
      openSignup,
      openForgotPassword,
    }),
    [openLogin, openSignup, openForgotPassword],
  )

  const openSettings = useCallback(() => {
    setSettingsOpen(true)
  }, [])

  const openRadioScheduleShare = useCallback(() => {
    setRadioScheduleShareBg(pickRandomShareBackground())
    setRadioScheduleShareOpen(true)
  }, [])

  useEffect(() => {
    if (!showRadioScheduleShare) setRadioScheduleShareOpen(false)
  }, [showRadioScheduleShare])

  useEffect(() => {
    if (
      !requestOpen &&
      !recentlyPlayedOpen &&
      !scheduleOpen &&
      !tourScheduleOpen &&
      !thisDayHistoryOpen &&
      !loginOpen &&
      !forgotOpen &&
      !signupOpen &&
      !archiveOpen &&
      !radioOpen &&
      !followUsOpen &&
      !radioScheduleShareOpen &&
      !settingsOpen
    )
      return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      setRequestOpen(false)
      setRecentlyPlayedOpen(false)
      setScheduleOpen(false)
      setTourScheduleOpen(false)
      setThisDayHistoryOpen(false)
      setLoginOpen(false)
      setForgotOpen(false)
      setSignupOpen(false)
      closeArchiveModal()
      setRadioOpen(false)
      setFollowUsOpen(false)
      setRadioScheduleShareOpen(false)
      setSettingsOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [
    requestOpen,
    recentlyPlayedOpen,
    scheduleOpen,
    tourScheduleOpen,
    thisDayHistoryOpen,
    loginOpen,
    forgotOpen,
    signupOpen,
    archiveOpen,
    radioOpen,
    followUsOpen,
    radioScheduleShareOpen,
    settingsOpen,
    closeArchiveModal,
  ])

  return (
    <SetlistBreadcrumbProvider>
      <SetlistCombinedRowsPreferenceProvider>
      <WlHomeV2AuthModalsContext.Provider value={authModals}>
      <WlHomeV2OpenSettingsContext.Provider value={openSettings}>
      <WlHomeV2OpenArchiveHubContext.Provider value={openArchiveHub}>
        <div className="wl-home-v2">
        <div className="wl-home-v2__stack">
          <WlHomeV2Header
            onOpenLogin={() => setLoginOpen(true)}
            onOpenSignup={() => {
              setLoginOpen(false)
              setSignupOpen(true)
            }}
            onOpenArchive={openArchiveHub}
            onOpenRadio={() => setRadioOpen(true)}
            onOpenFollowUs={() => setFollowUsOpen(true)}
            onOpenShareSchedule={
              showRadioScheduleShare ? openRadioScheduleShare : undefined
            }
          />

        <Suspense fallback={null}>
          <WlHomeV2ArchiveSubnav />
        </Suspense>

        <main
          className={cn(children == null && "wl-home-v2-main--homepage")}
        >
          {children == null ?
            <>
              {/* <WlHomeV2HomeTicker onOpenSchedule={() => setScheduleOpen(true)} /> */}
              <WlHomeV2Tiles
                onOpenRequest={() => setRequestOpen(true)}
                onOpenRecentlyPlayed={() => setRecentlyPlayedOpen(true)}
                onOpenLogin={() => setLoginOpen(true)}
                onOpenTourSchedule={() => setTourScheduleOpen(true)}
                onOpenThisDayInHistory={() => setThisDayHistoryOpen(true)}
              />
            </>
          : children}
        </main>

        <WlHomeV2Footer />
      </div>

        <Suspense fallback={null}>
          <WlHomeV2AuthQuerySync
            onOpenLogin={openLogin}
            onOpenSignup={openSignup}
            onOpenForgotPassword={openForgotPassword}
          />
        </Suspense>

        <WlHomeV2ShellModals
        requestOpen={requestOpen}
        setRequestOpen={setRequestOpen}
        requestHeadingId={requestHeadingId}
        recentlyPlayedOpen={recentlyPlayedOpen}
        setRecentlyPlayedOpen={setRecentlyPlayedOpen}
        recentlyPlayedHeadingId={recentlyPlayedHeadingId}
        scheduleOpen={scheduleOpen}
        setScheduleOpen={setScheduleOpen}
        scheduleHeadingId={scheduleHeadingId}
        tourScheduleOpen={tourScheduleOpen}
        setTourScheduleOpen={setTourScheduleOpen}
        tourScheduleHeadingId={tourScheduleHeadingId}
        thisDayHistoryOpen={thisDayHistoryOpen}
        setThisDayHistoryOpen={setThisDayHistoryOpen}
        thisDayHistoryHeadingId={thisDayHistoryHeadingId}
        loginOpen={loginOpen}
        setLoginOpen={setLoginOpen}
        loginHeadingId={loginHeadingId}
        forgotOpen={forgotOpen}
        setForgotOpen={setForgotOpen}
        forgotHeadingId={forgotHeadingId}
        signupOpen={signupOpen}
        setSignupOpen={setSignupOpen}
        signupHeadingId={signupHeadingId}
        archiveOpen={archiveOpen}
        closeArchiveModal={closeArchiveModal}
        archiveHeadingId={archiveHeadingId}
        radioOpen={radioOpen}
        setRadioOpen={setRadioOpen}
        radioHeadingId={radioHeadingId}
        showRadioScheduleShare={showRadioScheduleShare}
        radioScheduleShareOpen={radioScheduleShareOpen}
        setRadioScheduleShareOpen={setRadioScheduleShareOpen}
        radioScheduleShareBg={radioScheduleShareBg}
        followUsOpen={followUsOpen}
        setFollowUsOpen={setFollowUsOpen}
        followUsHeadingId={followUsHeadingId}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        settingsHeadingId={settingsHeadingId}
      />

      </div>
        </WlHomeV2OpenArchiveHubContext.Provider>
      </WlHomeV2OpenSettingsContext.Provider>
      </WlHomeV2AuthModalsContext.Provider>
      </SetlistCombinedRowsPreferenceProvider>
    </SetlistBreadcrumbProvider>
  )
}
