"use client"

import Image from "next/image"
import Link from "next/link"
import { List, X } from "@phosphor-icons/react"
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useState,
  type MouseEvent,
} from "react"
import { usePathname, useRouter } from "next/navigation"

import { RadioHomeSlot, RadioMobileSlot } from "@/components/persistent-radio"
import { useIsBelowXl } from "@/hooks/use-mobile"

import { toggleOldPathPrefix } from "@/lib/toggle-old-path-prefix"

import { WlHomeV2ArchiveSubnavContent } from "./wl-home-v2-archive-subnav"
import { WL_HOME_V2_COMMUNITY_URL } from "./wl-home-v2-constants"
import { WlHomeV2UserMenu } from "./wl-home-v2-user-menu"

export function WlHomeV2Header({
  onOpenLogin,
  onOpenSignup,
  onOpenArchive,
  onOpenRadio,
}: {
  onOpenLogin: () => void
  onOpenSignup: () => void
  /** Open the archive hub modal without leaving the current route (primary click). */
  onOpenArchive: () => void
  /** Open the WTED Radio hub modal (primary click). */
  onOpenRadio: () => void
}) {
  const isBelowXl = useIsBelowXl()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mobileNavId = useId()
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])

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

  const onOldPathDebugToggle = useCallback(() => {
    const nextPath = toggleOldPathPrefix(pathname)
    const search = typeof window !== "undefined" ? window.location.search : ""
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    router.push(`${nextPath}${search}${hash}`)
    closeMobileNav()
  }, [pathname, router, closeMobileNav])

  const oldPathDebugActive =
    pathname === "/old" || pathname.startsWith("/old/")

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
            width={26}
            height={26}
            className="h-[72%] w-[72%] object-contain"
          />
        </div>
        <div className="brand-text">
          <span className="wl">WTED.org</span>
          <span className="dotorg">The World of TED</span>
        </div>
      </Link>

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
          <a href="/wted/program-director" onClick={onRadioNavClick}>
            Radio
          </a>
          <a
            href={WL_HOME_V2_COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMobileNav}
          >
            Community
          </a>
          <a href="/archive" onClick={onArchivesNavClick}>
            Archives
          </a>
          <Link href="/support" onClick={closeMobileNav}>
            Support
          </Link>
          <button
            type="button"
            className="top-nav-old-toggle"
            aria-pressed={oldPathDebugActive}
            title="Toggle /old/ in URL (compare legacy vs new)"
            onClick={onOldPathDebugToggle}
          >
            OLD
          </button>
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

      <div className="top-user-menu">
        <WlHomeV2UserMenu
          onOpenLogin={onOpenLogin}
          onOpenSignup={onOpenSignup}
        />
      </div>
    </header>
  )
}
