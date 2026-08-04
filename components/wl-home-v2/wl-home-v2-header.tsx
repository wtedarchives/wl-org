"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CurrencyDollar,
  List,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react"
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type MouseEvent,
} from "react"
import { usePathname } from "next/navigation"

import { RadioHomeSlot, RadioMobileSlot } from "@/components/persistent-radio"
import { useIsBelowXl } from "@/hooks/use-mobile"
import { useSiteSearchAccess } from "@/hooks/use-site-search-access"

import { WlHomeV2ArchiveSubnavContent } from "./wl-home-v2-archive-subnav"
import {
  WL_HOME_V2_COMMUNITY_URL,
  WL_HOME_V2_TOP_NAV_PANEL_ID,
} from "./wl-home-v2-constants"
import { WlHomeV2HeaderPhraseRotator } from "./wl-home-v2-header-phrase-rotator"
import { useWlHomeV2OpenSiteSearch } from "./wl-home-v2-open-site-search-context"
import { WlHomeV2SiteSearch } from "./wl-home-v2-site-search"
import { WlHomeV2UserMenu } from "./wl-home-v2-user-menu"

function TopNavPrimaryImage({
  src,
  className,
}: {
  src: string
  className?: string
}) {
  return (
    <span
      className={[
        "top-nav-primary-icon top-nav-primary-icon--img",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      <Image
        src={src}
        alt=""
        width={80}
        height={80}
        className="top-nav-primary-img"
        sizes="22px"
      />
    </span>
  )
}

export function WlHomeV2Header({
  onOpenLogin,
  onOpenSignup,
  onOpenArchive,
  onOpenRadio,
  onOpenFollowUs,
  onOpenShareSchedule,
}: {
  onOpenLogin: () => void
  onOpenSignup: () => void
  /** Open the archive hub modal without leaving the current route (primary click). */
  onOpenArchive: () => void
  /** Open the WTED Radio hub modal (primary click). */
  onOpenRadio: () => void
  /** Open Follow Us (social links) modal — no route change. */
  onOpenFollowUs: () => void
  /** Admin-only: schedule PNG export modal. */
  onOpenShareSchedule?: () => void
}) {
  const isBelowXl = useIsBelowXl()
  const pathname = usePathname()
  const { allowed: siteSearchAllowed } = useSiteSearchAccess()
  const openSiteSearchFromShell = useWlHomeV2OpenSiteSearch()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  /** Stable id (not `useId`) — see `WL_HOME_V2_TOP_NAV_PANEL_ID` in constants. */
  const mobileNavId = WL_HOME_V2_TOP_NAV_PANEL_ID
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])

  const openSiteSearch = useCallback(() => {
    closeMobileNav()
    openSiteSearchFromShell?.()
  }, [closeMobileNav, openSiteSearchFromShell])

  const onArchivesNavClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
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
      onOpenArchive()
      closeMobileNav()
    },
    [onOpenArchive, closeMobileNav],
  )

  const onFollowUsNavClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
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
      onOpenFollowUs()
      closeMobileNav()
    },
    [onOpenFollowUs, closeMobileNav],
  )

  const onRadioNavClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
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
      onOpenRadio()
      closeMobileNav()
    },
    [onOpenRadio, closeMobileNav],
  )

  const isArchiveRoute =
    pathname === "/archive" || pathname.startsWith("/archive/")

  useEffect(() => {
    if (!mobileNavOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobileNav()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mobileNavOpen, closeMobileNav])

  return (
    <>
      <header className="top">
        <div className="top-embed-row">
          <div className="radio-embed-wrap radio-embed-wrap--header">
            {isBelowXl ?
              <RadioMobileSlot className="radio-embed min-h-[66px] w-full" />
            : <RadioHomeSlot className="radio-embed min-h-[66px] w-full" />}
          </div>
        </div>

        <button
          type="button"
          className="top-mobile-nav-toggle"
          aria-expanded={mobileNavOpen}
          aria-controls={mobileNavId}
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          {mobileNavOpen ?
            <X className="top-mobile-nav-icon" aria-hidden />
          : <List className="top-mobile-nav-icon" aria-hidden />}
          <span className="sr-only">
            {mobileNavOpen ? "Close site menu" : "Open site menu"}
          </span>
        </button>

        <div className="top-brand-cluster">
          <div className="top-brand-cluster-top">
            <Link
              href="/"
              className="brand"
              aria-label="Wysteria Lane home"
              onClick={closeMobileNav}
            >
              <div className="brand-mark">
                <Image
                  src="/WL.png"
                  alt=""
                  width={30}
                  height={30}
                  className="brand-mark-img"
                />
              </div>
              <div className="brand-text">
                <span className="wl">WTED Radio</span>
                <span className="dotorg">Powered by Wysteria Lane</span>
              </div>
            </Link>
            <div className="top-brand-cluster-actions">
              <Link href="/support" onClick={closeMobileNav}>
                <CurrencyDollar
                  className="top-nav-primary-icon"
                  size={18}
                  weight="regular"
                  aria-hidden
                />
                Support Us
              </Link>
              <a
                href="#"
                aria-haspopup="dialog"
                onClick={onFollowUsNavClick}
              >
                <ArrowRight
                  className="top-nav-primary-icon"
                  size={18}
                  weight="regular"
                  aria-hidden
                />
                Follow Us
              </a>
            </div>
          </div>
          <WlHomeV2HeaderPhraseRotator />
        </div>

        <div className="top-header-controls">
          <div className="top-header-controls-stack">
            <div className="top-header-controls-top-row">
              <nav
                id={mobileNavId}
                className={[
                  "top-nav",
                  mobileNavOpen ? "top-nav--mobile-open" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label="Primary"
              >
                <div className="top-nav-primary-row">
                  <a
                    href="/radio/episodes"
                    className="top-nav-radio-link"
                    onClick={onRadioNavClick}
                  >
                    <TopNavPrimaryImage
                      src="/WTED.png"
                      className="top-nav-radio-img--desktop"
                    />
                    <TopNavPrimaryImage
                      src="/WTED2.png"
                      className="top-nav-radio-img--mobile"
                    />
                    Radio
                  </a>
                  <a
                    href={WL_HOME_V2_COMMUNITY_URL}
                    className="top-nav-community-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMobileNav}
                  >
                    <TopNavPrimaryImage
                      src="/WL.png"
                      className="top-nav-community-img"
                    />
                    Community
                  </a>
                  <a
                    href="/archive"
                    className="top-nav-archives-link"
                    onClick={onArchivesNavClick}
                  >
                    <TopNavPrimaryImage
                      src="/wted-sa-cropped-2.png"
                      className="top-nav-archives-img"
                    />
                    Archives
                  </a>
                </div>
                <div className="top-nav-secondary-row">
                  <Link href="/support" onClick={closeMobileNav}>
                    <CurrencyDollar
                      className="top-nav-primary-icon"
                      size={18}
                      weight="regular"
                      aria-hidden
                    />
                    Support Us
                  </Link>
                  <a
                    href="#"
                    aria-haspopup="dialog"
                    onClick={onFollowUsNavClick}
                  >
                    <ArrowRight
                      className="top-nav-primary-icon"
                      size={18}
                      weight="regular"
                      aria-hidden
                    />
                    Follow Us
                  </a>
                </div>
                {isArchiveRoute ?
                  <Suspense fallback={null}>
                    <WlHomeV2ArchiveSubnavContent
                      className="wl-home-v2-archive-subnav--drawer md:hidden"
                      onNavigate={closeMobileNav}
                    />
                  </Suspense>
                : null}
              </nav>

              <div className="top-user-cluster">
                {siteSearchAllowed ?
                  <button
                    type="button"
                    className="wl-home-v2-site-search-icon-trigger"
                    aria-haspopup="dialog"
                    aria-label="Search archive"
                    onClick={openSiteSearch}
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
                <div className="top-user-menu">
                  <WlHomeV2UserMenu
                    onOpenLogin={onOpenLogin}
                    onOpenSignup={onOpenSignup}
                    onOpenShareSchedule={onOpenShareSchedule}
                  />
                </div>
              </div>
            </div>
            {siteSearchAllowed ? <WlHomeV2SiteSearch /> : null}
          </div>
        </div>
      </header>
    </>
  )
}
