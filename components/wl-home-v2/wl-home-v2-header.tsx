"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useCallback, useEffect, useId, useState } from "react"

import { RadioHomeSlot, RadioMobileSlot } from "@/components/persistent-radio"
import { useIsBelowXl } from "@/hooks/use-mobile"

import { WL_HOME_V2_COMMUNITY_URL } from "./wl-home-v2-constants"
import { WlHomeV2UserMenu } from "./wl-home-v2-user-menu"

export function WlHomeV2Header({
  onOpenLogin,
  onOpenSignup,
}: {
  onOpenLogin: () => void
  onOpenSignup: () => void
}) {
  const isBelowXl = useIsBelowXl()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mobileNavId = useId()
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])

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
        : <Menu className="top-mobile-nav-icon" aria-hidden />}
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
          <span className="wl">World of TED</span>
          <span className="dotorg">WTED.ORG</span>
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
        <Link href="/wted" onClick={closeMobileNav}>
          Radio
        </Link>
        <a
          href={WL_HOME_V2_COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMobileNav}
        >
          Community
        </a>
        <Link href="/archive" onClick={closeMobileNav}>
          Archives
        </Link>
        <Link href="/support" onClick={closeMobileNav}>
          Support
        </Link>
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
