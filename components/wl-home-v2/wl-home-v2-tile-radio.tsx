"use client"

import {
  AppleLogo,
  ArrowRight,
  GooglePlayLogo,
  Info,
  ListNumbers,
  MusicNote,
  Users,
} from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import type { CSSProperties } from "react"
import { useLayoutEffect } from "react"

import {
  RadioHomepageTopSlot,
  usePersistentRadioTileScheduleGate,
} from "@/components/persistent-radio"
import { useRadioSchedule } from "@/hooks/use-radio-schedule"

import { WlHomeV2OnAirPill } from "./wl-home-v2-on-air-pill"

export function WlHomeV2TileRadio({
  onWtedRadioTileClick,
  onOpenRequest,
  onOpenSchedule,
}: {
  onWtedRadioTileClick: () => void
  onOpenRequest: () => void
  onOpenSchedule: () => void
}) {
  const { slots, loading, error } = useRadioSchedule()
  const setRadioTileScheduleReady = usePersistentRadioTileScheduleGate()

  useLayoutEffect(() => {
    setRadioTileScheduleReady(!loading)
    return () => setRadioTileScheduleReady(false)
  }, [loading, setRadioTileScheduleReady])

  return (
    <section
      className="tile tile-radio"
      style={{ "--tile-bg": "url('/newbg.png')" } as CSSProperties}
      onClick={(e) => {
        const el = e.target as HTMLElement | null
        if (el?.closest(".tile-widget")) return
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
        <div
          id="wl-home-v2-radio-tile-player-anchor"
          className="wl-home-v2-radio-tile-on-air-card"
        >
          <div className="wl-home-v2-radio-tile-on-air-card__embed radio-embed-wrap">
            <RadioHomepageTopSlot className="radio-embed min-h-[66px] w-full" />
          </div>
          <WlHomeV2OnAirPill
            onOpenSchedule={onOpenSchedule}
            slots={slots}
            loading={loading}
            error={error}
          />
        </div>
        <div className="tile-widget-actions">
          <button
            type="button"
            className="wbtn"
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
          <Link className="wbtn" href="/wted/program-director">
            <span className="wbtn-text">Program Director</span>
            <ListNumbers className="wbtn-icon" size={18} weight="regular" aria-hidden />
          </Link>
          <Link className="wbtn" href="/wted/about">
            <span className="wbtn-text">About Us</span>
            <Info className="wbtn-icon" size={18} weight="regular" aria-hidden />
          </Link>
          <Link className="wbtn" href="/wted/gorps">
            <span className="wbtn-text">GORPs</span>
            <Users className="wbtn-icon" size={18} weight="regular" aria-hidden />
          </Link>
          <a
            className="wbtn wbtn--app-store"
            href="https://apps.apple.com/us/app/wted-goose-radio/id6476207418"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="wbtn-text">iOS App</span>
            <AppleLogo className="wbtn-icon" size={18} weight="regular" aria-hidden />
          </a>
          <a
            className="wbtn wbtn--app-store"
            href="https://play.google.com/store/apps/details?id=com.m92a0e1796e8f.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="wbtn-text">Android App</span>
            <GooglePlayLogo
              className="wbtn-icon"
              size={18}
              weight="regular"
              aria-hidden
            />
          </a>
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
      </div>
    </section>
  )
}
