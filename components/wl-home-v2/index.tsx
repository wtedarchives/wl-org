"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"

import { useWtedRadioNowPlaying } from "@/hooks/use-wted-radio-now-playing"

import "./wl-home-v2.css"
import { SubmitModalHandler } from "@/components/submit-modal-handler"

import { WlHomeV2ArchiveModal } from "./wl-home-v2-archive-modal"
import { WlHomeV2FollowUsModal } from "./wl-home-v2-follow-us-modal"
import { WlHomeV2RadioModal } from "./wl-home-v2-radio-modal"
import { WlHomeV2ArchiveSubnav } from "./wl-home-v2-archive-subnav"
import { WlHomeV2Footer } from "./wl-home-v2-footer"
import { WlHomeV2ForgotPasswordModal } from "./wl-home-v2-forgot-password-modal"
import { WlHomeV2Header } from "./wl-home-v2-header"
import { WlHomeV2LoginModal } from "./wl-home-v2-login-modal"
import { WlHomeV2RequestModal } from "./wl-home-v2-request-modal"
import { WlHomeV2ScheduleModal } from "./wl-home-v2-schedule-modal"
import { WlHomeV2ThisDayHistoryModal } from "./wl-home-v2-this-day-history-modal"
import { WlHomeV2TourScheduleModal } from "./wl-home-v2-tour-schedule-modal"
import { WlHomeV2SignupModal } from "./wl-home-v2-signup-modal"
import { WlHomeV2OpenArchiveHubContext } from "./wl-home-v2-open-archive-hub-context"
import { WlHomeV2Tiles } from "./wl-home-v2-tiles"

const WELCOME_TICKER_COPY =
  "Welcome to Wysteria Lane, built by Goose fans, for Goose fans."

const NOW_PLAYING_TICKER_PREFIX = "Now playing on WTED Goose Radio:  "

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

  const [requestOpen, setRequestOpen] = useState(false)
  const requestHeadingId = useId()

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

  const [followUsOpen, setFollowUsOpen] = useState(false)
  const followUsHeadingId = useId()

  const closeArchiveModal = useCallback(() => {
    setArchiveOpen(false)
    if (pathname === "/archive") {
      router.replace("/")
    }
  }, [pathname, router])

  const openArchiveHub = useCallback(() => {
    setArchiveOpen(true)
  }, [])

  const { title: nowPlayingTitle, loading: nowPlayingLoading } =
    useWtedRadioNowPlaying()

  const nowPlayingLine = useMemo(() => {
    if (nowPlayingLoading && !nowPlayingTitle) {
      return `${NOW_PLAYING_TICKER_PREFIX}…`
    }
    if (nowPlayingTitle) {
      return `${NOW_PLAYING_TICKER_PREFIX}${nowPlayingTitle}`
    }
    return null
  }, [nowPlayingTitle, nowPlayingLoading])

  const tickerAriaLabel =
    nowPlayingLine != null ?
      `${WELCOME_TICKER_COPY} ${nowPlayingLine}`
    : WELCOME_TICKER_COPY

  const tickerButtonAriaLabel = `${tickerAriaLabel} Opens full WTED schedule.`

  const openSchedule = useCallback(() => setScheduleOpen(true), [])

  const onTickerKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        openSchedule()
      }
    },
    [openSchedule],
  )

  useEffect(() => {
    if (
      !requestOpen &&
      !scheduleOpen &&
      !tourScheduleOpen &&
      !thisDayHistoryOpen &&
      !loginOpen &&
      !forgotOpen &&
      !signupOpen &&
      !archiveOpen &&
      !radioOpen &&
      !followUsOpen
    )
      return
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return
      setRequestOpen(false)
      setScheduleOpen(false)
      setTourScheduleOpen(false)
      setThisDayHistoryOpen(false)
      setLoginOpen(false)
      setForgotOpen(false)
      setSignupOpen(false)
      closeArchiveModal()
      setRadioOpen(false)
      setFollowUsOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [
    requestOpen,
    scheduleOpen,
    tourScheduleOpen,
    thisDayHistoryOpen,
    loginOpen,
    forgotOpen,
    signupOpen,
    archiveOpen,
    radioOpen,
    followUsOpen,
    closeArchiveModal,
  ])

  return (
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
          />

        <Suspense fallback={null}>
          <WlHomeV2ArchiveSubnav />
        </Suspense>

        <main>
          {children == null ?
            <>
              <div
                className="wl-home-v2-ticker"
                role="button"
                tabIndex={0}
                aria-label={tickerButtonAriaLabel}
                onClick={openSchedule}
                onKeyDown={onTickerKeyDown}
              >
                <div className="wl-home-v2-ticker-viewport">
                  <div className="wl-home-v2-ticker-track">
                    {Array.from({ length: 4 }, (_, copyIndex) => (
                      <span
                        key={copyIndex}
                        className="wl-home-v2-ticker-unit"
                        aria-hidden="true"
                      >
                        <span className="wl-home-v2-ticker-segment">
                          {WELCOME_TICKER_COPY}
                        </span>
                        {nowPlayingLine != null ?
                          <span className="wl-home-v2-ticker-segment wl-home-v2-ticker-segment--now-playing">
                            <span className="live-dot" aria-hidden />
                            {nowPlayingLine}
                          </span>
                        : null}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <WlHomeV2Tiles
                onOpenRequest={() => setRequestOpen(true)}
                onOpenLogin={() => setLoginOpen(true)}
                onOpenSchedule={() => setScheduleOpen(true)}
                onOpenTourSchedule={() => setTourScheduleOpen(true)}
                onOpenThisDayInHistory={() => setThisDayHistoryOpen(true)}
              />
            </>
          : children}
        </main>

        <WlHomeV2Footer />
      </div>

      {/* Modals use WlHomeV2ModalPortal → document.body so the dimmer stacks above #__next / header. */}
      <WlHomeV2RequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        headingId={requestHeadingId}
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
      />
      <WlHomeV2RadioModal
        open={radioOpen}
        onClose={() => setRadioOpen(false)}
        headingId={radioHeadingId}
        onRequestSong={() => setRequestOpen(true)}
      />
      <WlHomeV2FollowUsModal
        open={followUsOpen}
        onClose={() => setFollowUsOpen(false)}
        headingId={followUsHeadingId}
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

    </div>
    </WlHomeV2OpenArchiveHubContext.Provider>
  )
}
