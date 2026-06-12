import Link from "next/link"

import {
  WTED_LINKS_APP_STORE_URL,
  WTED_LINKS_GOOGLE_PLAY_URL,
  WTED_LINKS_ITEMS,
} from "@/components/wted/wted-links-content"

import "./wted-links-wl-home-v2.css"

export function WtedLinksWlHomeV2() {
  return (
    <div className="wted-links wted-inner-page-bg">
      <div className="wted-links__inner">
        <div className="wted-links__heading">
          <div className="wted-links__heading-line">You want links?</div>
          <div className="wted-links__heading-line">We got links.</div>
        </div>

        <nav className="wted-links__nav" aria-label="WTED links">
          {WTED_LINKS_ITEMS.map((item) =>
            item.external ?
              <a
                key={item.href}
                href={item.href}
                className="wted-links__btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            : <Link key={item.href} href={item.href} className="wted-links__btn">
                {item.label}
              </Link>,
          )}
        </nav>

        <div className="wted-links__store-badges">
          <a
            className="wted-links__store-badge-link wted-links__store-badge-link--ios"
            href={WTED_LINKS_APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download WTED Goose Radio on the App Store"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/iOS.svg"
              alt=""
              className="wted-links__store-badge-img"
            />
          </a>
          <a
            className="wted-links__store-badge-link wted-links__store-badge-link--android"
            href={WTED_LINKS_GOOGLE_PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get WTED Goose Radio on Google Play"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Android.svg"
              alt=""
              className="wted-links__store-badge-img"
            />
          </a>
        </div>
      </div>
    </div>
  )
}
