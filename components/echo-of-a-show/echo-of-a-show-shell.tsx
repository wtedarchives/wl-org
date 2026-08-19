"use client"

import type { ReactNode } from "react"
import Link from "next/link"

import { SetlistGameWlV2ChromeProvider } from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { WL_V2_ARCHIVES_BREADCRUMB_ROOT } from "@/components/setlist-breadcrumb-context"
import { getEchoOfAShowIndexUrl } from "@/lib/echo-of-a-show-url"
import { formatEchoUsername } from "@/lib/echo-of-a-show"
import type { WysteriaSession } from "@/lib/jwt"

import "./echo-of-a-show.css"

export function EchoOfAShowShell({
  children,
  session,
  crumbLabel = "Echo of a Show",
  onHowToPlay,
  onScoreShow,
  showScoreShow = false,
  onLogin,
  onSignup,
}: {
  children: ReactNode
  session: WysteriaSession | null
  crumbLabel?: string
  onHowToPlay: () => void
  onScoreShow?: () => void
  showScoreShow?: boolean
  onLogin: () => void
  onSignup: () => void
}) {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const username = formatEchoUsername(session?.username)

  return (
    <SetlistGameWlV2ChromeProvider>
      <div className="wl-home-v2-years-page echo-of-a-show">
        <div className="wl-home-v2-years-body">
          <div className="wl-home-v2-years-columns">
            <section className="wl-home-v2-years-tile wl-home-v2-years-tile--main echo-of-a-show__tile">
              <div className="echo-of-a-show__tile-inner">
                <header className="echo-of-a-show__topbar">
                  <span className="echo-of-a-show__on-air">
                    <span className="echo-of-a-show__brand-dot" aria-hidden />
                    On air
                  </span>
                  <span className="echo-of-a-show__title">Echo of a Show</span>
                  <div className="echo-of-a-show__topbar-end">
                    {showScoreShow && onScoreShow ?
                      <button
                        type="button"
                        className="echo-of-a-show__text-btn echo-of-a-show__text-btn--admin"
                        onClick={onScoreShow}
                      >
                        Score Show
                      </button>
                    : null}
                    <button
                      type="button"
                      className="echo-of-a-show__text-btn"
                      onClick={onHowToPlay}
                    >
                      How to Play
                    </button>
                    {session ?
                      <>
                        {username ?
                          <span className="echo-of-a-show__username">
                            {username}
                          </span>
                        : null}
                        {session.avatarUrl ?
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={session.avatarUrl}
                            alt=""
                            className="echo-of-a-show__avatar"
                            width={24}
                            height={24}
                          />
                        : <span
                            className="echo-of-a-show__avatar echo-of-a-show__avatar--empty"
                            aria-hidden
                          />}
                      </>
                    : <>
                        <button
                          type="button"
                          className="echo-of-a-show__ghost-btn"
                          onClick={onLogin}
                        >
                          Log in
                        </button>
                        <button
                          type="button"
                          className="echo-of-a-show__cta-btn"
                          onClick={onSignup}
                        >
                          Sign up
                        </button>
                      </>}
                  </div>
                </header>

                <nav className="echo-of-a-show__crumbs" aria-label="Breadcrumb">
                  {openArchiveHub ?
                    <Link
                      href={WL_V2_ARCHIVES_BREADCRUMB_ROOT.href}
                      onClick={(e) => {
                        if (
                          e.button !== 0 ||
                          e.metaKey ||
                          e.ctrlKey ||
                          e.shiftKey ||
                          e.altKey
                        ) {
                          return
                        }
                        e.preventDefault()
                        openArchiveHub()
                      }}
                    >
                      {WL_V2_ARCHIVES_BREADCRUMB_ROOT.label}
                    </Link>
                  : <Link href={WL_V2_ARCHIVES_BREADCRUMB_ROOT.href}>
                      {WL_V2_ARCHIVES_BREADCRUMB_ROOT.label}
                    </Link>}
                  <span className="echo-of-a-show__crumbs-sep">&gt;</span>
                  {crumbLabel === "Echo of a Show" ?
                    <span className="echo-of-a-show__crumbs-here">
                      Echo of a Show
                    </span>
                  : <>
                      <Link href={getEchoOfAShowIndexUrl()}>Echo of a Show</Link>
                      <span className="echo-of-a-show__crumbs-sep">&gt;</span>
                      <span className="echo-of-a-show__crumbs-here">
                        {crumbLabel}
                      </span>
                    </>}
                </nav>

                <div className="echo-of-a-show__body">{children}</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </SetlistGameWlV2ChromeProvider>
  )
}
