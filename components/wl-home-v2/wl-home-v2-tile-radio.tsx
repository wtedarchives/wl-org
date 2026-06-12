"use client"

import { ArrowRight, Info, ListNumbers, MusicNote, Play, Users } from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import type { CSSProperties } from "react"

import { useRadioScheduleWeek } from "@/hooks/use-radio-schedule"

import { WlHomeV2OnAirPill } from "./wl-home-v2-on-air-pill"

export function WlHomeV2TileRadio({
  onWtedRadioTileClick,
  onOpenRequest,
  onOpenRecentlyPlayed,
}: {
  onWtedRadioTileClick: () => void
  onOpenRequest: () => void
  onOpenRecentlyPlayed: () => void
}) {
  const { days, loading, error } = useRadioScheduleWeek()

  return (
    <section
      className="tile tile-radio"
      style={{ "--tile-bg": "url('/newbg.png')" } as CSSProperties}
      onClick={(e) => {
        const el = e.target as HTMLElement | null
        if (el?.closest(".tile-widget, .tile-widget-store-badges")) return
        onWtedRadioTileClick()
      }}
    >
      <button
        type="button"
        className="tile-link"
        aria-label="Tune in to WTED Goose Radio — scroll to the player and highlight it"
        onClick={(e) => {
          e.stopPropagation()
          onWtedRadioTileClick()
        }}
      />
      <div className="icon-wrap">
        <div className="icon-bg" />
        <Image
          src="/WTED3.png"
          alt=""
          width={110}
          height={110}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="tile-widget">
        <div className="widget-panel wl-home-v2-radio-tile-on-air-card">
          <WlHomeV2OnAirPill
            days={days}
            loading={loading}
            error={error}
          />
        </div>
        <div className="tile-widget-actions">
          <div className="tile-widget-actions-row">
            <button
              type="button"
              className="wbtn wbtn--app-store"
              id="btn-request"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onOpenRequest()
              }}
            >
              <span className="wbtn-text">Request a Song</span>
              <MusicNote className="wbtn-icon" size={18} weight="regular" aria-hidden />
            </button>
            <button
              type="button"
              className="wbtn wbtn--app-store"
              id="btn-recently-played"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onOpenRecentlyPlayed()
              }}
            >
              <span className="wbtn-text">Recently Played</span>
              <Play className="wbtn-icon" size={18} weight="regular" aria-hidden />
            </button>
          </div>
          <div className="tile-widget-actions-row tile-widget-actions-row--triple">
            <Link className="wbtn wbtn--app-store" href="/wted/about">
              <span className="wbtn-text">About Us</span>
              <Info className="wbtn-icon" size={18} weight="regular" aria-hidden />
            </Link>
            <Link className="wbtn wbtn--app-store" href="/wted/gorps">
              <span className="wbtn-text">GORPs</span>
              <Users className="wbtn-icon" size={18} weight="regular" aria-hidden />
            </Link>
            <Link className="wbtn wbtn--app-store" href="/wted/program-director">
              <span className="wbtn-text">Episodes</span>
              <ListNumbers className="wbtn-icon" size={18} weight="regular" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <div className="tile-body">
        <h2>
          WTED
          <br />
          Goose Radio
        </h2>
        <span className="tile-radio-attribution-pill">
          Powered by Wysteria Lane
        </span>
        <p>
          Listen to Goose on demand, 24/7 — live streams, historic sets, and
          listener requests.
        </p>
        <span className="cta">
          <span className="cta-label">Tune in</span>
          <ArrowRight
            className="arrow"
            size={16}
            weight="regular"
            aria-hidden
          />
        </span>
        <div className="tile-widget-store-badges">
          <a
            className="tile-widget-store-badge-link tile-widget-store-badge-link--ios focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(88,200,174)]"
            href="https://apps.apple.com/us/app/wted-goose-radio/id6476207418"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download WTED Goose Radio on the App Store"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/iOS.svg"
              alt=""
              className="tile-widget-store-badge-img"
            />
          </a>
          <a
            className="tile-widget-store-badge-link tile-widget-store-badge-link--android focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(88,200,174)]"
            href="https://play.google.com/store/apps/details?id=com.m92a0e1796e8f.app"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get WTED Goose Radio on Google Play"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Android.svg"
              alt=""
              className="tile-widget-store-badge-img"
            />
          </a>
        </div>
      </div>
    </section>
  )
}
