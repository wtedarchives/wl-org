"use client"

import { useEffect, useId, useState, type ReactNode } from "react"
import Link from "next/link"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import {
  dismissWelcomeModalPermanently,
  muteWelcomeModalForOneDay,
  shouldShowWelcomeModal,
} from "@/lib/wl-home-v2-welcome-modal-storage"
import "./wl-home-v2-welcome-modal.css"

function ExtLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

/**
 * Homepage-only welcome announcement. Close mutes for 24h; “Don’t show this again”
 * dismisses permanently (localStorage).
 */
export function WlHomeV2WelcomeModal() {
  const headingId = useId()
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    setReady(true)
    if (shouldShowWelcomeModal()) setOpen(true)
  }, [])

  const closeForOneDay = () => {
    muteWelcomeModalForOneDay()
    setOpen(false)
  }

  const dismissForever = () => {
    dismissWelcomeModalPermanently()
    setOpen(false)
  }

  if (!ready) return null

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="wl-home-v2-welcome-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeForOneDay()
        }}
      >
        <div
          className="modal modal--wted-request modal--welcome"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Welcome to the all-new WTEDRadio.com!</h3>
            </div>
            <button
              type="button"
              className="modal-request-close"
              onClick={closeForOneDay}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="modal-request-body modal-welcome-body">
            <div className="modal-welcome-scroll">
              <p>
                A little more than three years ago, we launched WTED Goose Radio
                and the Wysteria Lane Community as a place for Goose fans to
                come together. Thousands of fans from around the world have
                joined us and created one of the best communities on the
                internet in that short time. Today we’re delighted to share with
                you what we’ve been working on for the last few months: the next
                evolution of WTED.
              </p>

              <h4 className="modal-welcome-section-title">What’s Happening?</h4>
              <p>Several updates are launching now:</p>
              <ul className="modal-welcome-list">
                <li>
                  We’ve expanded the offerings of WTED Radio and the Community
                  to include setlist and personal stat tracking called{" "}
                  <Link href="/archive" onClick={closeForOneDay}>
                    WTED Archives
                  </Link>
                  .
                </li>
                <li>
                  We’ve completely rebuilt and redesigned the WTEDRadio.com
                  experience to support these new capabilities, featuring art
                  from community member{" "}
                  <ExtLink href="https://community.wysterialane.org/u/leadtheway726">
                    @leadtheway726
                  </ExtLink>
                  .
                </li>
                <li>
                  You can use your same Community login information to create
                  personalized stats based on shows you’ve attended as well as
                  dive deeper into setlists and all of the detailed datapoints
                  that satisfy your inner stats nerd in{" "}
                  <Link
                    href="/archive/profile?tab=overview"
                    onClick={closeForOneDay}
                  >
                    My Show Stats
                  </Link>
                  .
                </li>
                <li>
                  We’ve built out a listing of every show on{" "}
                  <Link href="/radio/episodes" onClick={closeForOneDay}>
                    WTED Goose Radio
                  </Link>{" "}
                  and now you can view each show and the songs within it. Show
                  stats and details link to YouTube and Bandcamp versions of the
                  songs/shows as appropriate, and you can also request a song to
                  be played on WTED during RequestTED segments.
                </li>
              </ul>

              <p>
                We’ve done this by partnering with Dripfield.pro (launched by{" "}
                <ExtLink href="https://community.wysterialane.org/u/watsonbriant">
                  @watsonbriant
                </ExtLink>
                ) and transforming it into a unified experience which means that
                your Community login works across both the
                community.wysterialane.org site as well as WTEDRadio.com where
                the setlist data and your personal stats reside. You can select
                which shows you’ve attended, curate your own stats, and more
                over in the My Show Stats section.
              </p>

              <p>
                Additionally, we’ve made updates to the{" "}
                <ExtLink href="https://play.google.com/store/apps/details?id=com.m92a0e1796e8f.app">
                  WTED Radio app for Android
                </ExtLink>{" "}
                so that it now supports Android Auto out of the box. The WTED
                radio players available on the Community and on WTEDRadio.com
                now use the same codebase for identical experiences no matter
                how you choose to access WTED.
              </p>

              <h4 className="modal-welcome-section-title">
                What Do I Need To Do?
              </h4>
              <p>
                If you have an account on the Wysteria Lane Community,
                there is nothing extra
                you need to do in order to utilize these new features. Simply
                visit WTEDRadio.com and if you’re logged into the Community
                already, you’ll be logged in there. If you’re not logged in, go
                through the normal login process using your Community
                credentials.
              </p>

              <p>
                There’s a detailed FAQ with video tutorials available at{" "}
                <Link href="/help" onClick={closeForOneDay}>
                  WTEDRadio.com/help
                </Link>
                . Additionally, we’re happy to field any questions or help
                resolve any issues you find. Please feel free to reach out to us
                on the{" "}
                <ExtLink href="https://community.wysterialane.org">
                  Wysteria Lane Community
                </ExtLink>
                . We’re excited about this journey
                and hope you enjoy the new features.
              </p>

              <p className="modal-welcome-signoff">
                – Basty, Ben, Brett, Brian, Kyle, Shawna, Sim, &amp; Corey
              </p>
            </div>

            <div className="modal-welcome-actions">
              <button
                type="button"
                className="wbtn primary"
                onClick={dismissForever}
              >
                Don’t show this again
              </button>
              <button
                type="button"
                className="wbtn green"
                onClick={closeForOneDay}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
