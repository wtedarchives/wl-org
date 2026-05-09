"use client"

import type { CSSProperties } from "react"
import { useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"

import {
  type WlHomePersonnelCatalogRow,
} from "@/hooks/use-wl-home-personnel-catalog"
import { formatInstrument } from "@/lib/personnel-utils"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"

export type PersonnelTileKey = "current" | "former"

/** Back photo per top-row tile (homepage personnel-style). */
const PERSONNEL_TILE_BACKGROUNDS: Record<
  PersonnelTileKey,
  `/newbg.png` | `/newbg2.jpeg`
> = {
  current: "/newbg.png",
  former: "/newbg2.jpeg",
}

export const PERSONNEL_TOP_TILES: readonly {
  key: PersonnelTileKey
  label: string
  showInstrument: boolean
}[] = [
  { key: "current", label: "Current Goose Members", showInstrument: true },
  { key: "former", label: "Former Goose Members", showInstrument: true },
]

/** Viewport inner width above this uses {@link GUESTS_GROUPS_WIDE_MAX_COLS} columns. */
const GUESTS_GROUPS_WIDE_MAX_COL_BREAK_PX = 1440
/** Each full step of this many px below the break removes one column from the max. */
const GUESTS_GROUPS_COL_STEP_PX = 144
/** Maximum columns when the viewport is wide enough. */
const GUESTS_GROUPS_WIDE_MAX_COLS = 10

const COMBINED_GUESTS_GROUPS_BG = "/newbg3.jpeg" as const

/** Headshot assets for homepage-style mini icons (`/public/big-*.png`). */
function getPersonnelCurrentBigPortraitSrc(guestDisplayName: string): string | null {
  const name = guestDisplayName.trim().toLowerCase()
  if (name.includes("cotter")) return "/big-cotter.png"
  if (name.includes("anspach")) return "/big-peter.png"
  if (name.includes("mitarotonda")) return "/big-rick.png"
  if (name.includes("weeks")) return "/big-trevor.png"
  return null
}

/** Greater than {@link GUESTS_GROUPS_WIDE_MAX_COL_BREAK_PX}px viewport width uses max columns; each 144px narrower drops one column (minimum 1). */
function guestsGroupsGridColumnCount(innerWidth: number): number {
  const w = Math.max(0, Math.floor(innerWidth))
  if (w > GUESTS_GROUPS_WIDE_MAX_COL_BREAK_PX) return GUESTS_GROUPS_WIDE_MAX_COLS
  const steps = Math.floor(
    (GUESTS_GROUPS_WIDE_MAX_COL_BREAK_PX - w) / GUESTS_GROUPS_COL_STEP_PX,
  )
  return Math.max(1, GUESTS_GROUPS_WIDE_MAX_COLS - steps)
}

function useGuestsGroupsGridColumnCount(): number {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("resize", onChange)
      return () => window.removeEventListener("resize", onChange)
    },
    () => guestsGroupsGridColumnCount(window.innerWidth),
    () => GUESTS_GROUPS_WIDE_MAX_COLS,
  )
}

export function PersonnelCatalogTile({
  tileKey,
  label,
  showInstrument,
  items,
}: {
  tileKey: PersonnelTileKey
  label: string
  showInstrument: boolean
  items: WlHomePersonnelCatalogRow[]
}) {
  const tileBg = PERSONNEL_TILE_BACKGROUNDS[tileKey]
  const tileStyle = {
    "--tile-bg": `url(${JSON.stringify(tileBg)})`,
  } as CSSProperties
  return (
    <section
      className={[
        "tile tile-personnel-catalog",
        tileKey === "current" ? "tile-personnel-catalog--current" : "",
        tileKey === "former" ? "tile-personnel-catalog--former" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={tileStyle}
    >
      <div className="tile-personnel-catalog-inner">
        <h2 className="sc-label wl-home-v2-songs-archive-section-heading tile-personnel-catalog-songs-heading">
          {label}
        </h2>
        {items.length === 0 ?
          <p className="tile-personnel-catalog-empty">No entries</p>
        : tileKey === "current" ?
          <ul
            className="tile-personnel-catalog-list tile-personnel-catalog-list--current-mini-grid"
            aria-label="Current Goose members"
          >
            {items.map((item) => {
              const portraitSrc = getPersonnelCurrentBigPortraitSrc(item.guest)
              return (
                <li
                  key={item.guest_id}
                  className="tile-personnel-catalog-item tile-personnel-catalog-current-mini-cell"
                >
                  <Link
                    href={getPersonnelArchiveUrl(item.guest_id)}
                    className="tile-personnel-catalog-link tile-personnel-catalog-current-mini-tile"
                  >
                    {portraitSrc ?
                      <span
                        className="icon-wrap tile-personnel-catalog-current-mini-icon-wrap"
                        aria-hidden
                      >
                        <span className="icon-bg" />
                        <Image
                          src={portraitSrc}
                          alt=""
                          width={140}
                          height={140}
                          className="object-contain"
                        />
                      </span>
                    : null}
                    <span className="tile-personnel-catalog-name">
                      {item.guest}
                    </span>
                    {showInstrument && item.guest_instrument ?
                      <span className="tile-personnel-catalog-instrument-chip">
                        <span className="tile-personnel-catalog-instrument">
                          {formatInstrument(item.guest_instrument, { wrapInParens: false })}
                        </span>
                      </span>
                    : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        : tileKey === "former" ?
          <ul
            className="tile-personnel-catalog-list tile-personnel-catalog-list--former-mini-grid"
            aria-label="Former Goose members"
          >
            {items.map((item) => (
              <li
                key={item.guest_id}
                className="tile-personnel-catalog-item tile-personnel-catalog-former-mini-cell"
              >
                <Link
                  href={getPersonnelArchiveUrl(item.guest_id)}
                  className="tile-personnel-catalog-link tile-personnel-catalog-former-mini-tile"
                >
                  <span className="tile-personnel-catalog-name">
                    {item.guest}
                  </span>
                  {showInstrument && item.guest_instrument ?
                    <span className="tile-personnel-catalog-instrument-chip">
                      <span className="tile-personnel-catalog-instrument">
                        {formatInstrument(item.guest_instrument, { wrapInParens: false })}
                      </span>
                    </span>
                  : null}
                </Link>
              </li>
            ))}
          </ul>
        : null}
      </div>
    </section>
  )
}

function mergeGuestsAndGroupsSorted(
  guests: WlHomePersonnelCatalogRow[],
  groups: WlHomePersonnelCatalogRow[],
): WlHomePersonnelCatalogRow[] {
  return [...guests, ...groups].sort((a, b) =>
    a.guest.localeCompare(b.guest, undefined, { sensitivity: "base" }),
  )
}

/** Full-width tile: guests + groups merged; column count tracks viewport width. */
export function PersonnelGuestsGroupsCombinedTile({
  guests,
  groups,
}: {
  guests: WlHomePersonnelCatalogRow[]
  groups: WlHomePersonnelCatalogRow[]
}) {
  const gridCols = useGuestsGroupsGridColumnCount()
  const tileStyle = {
    "--tile-bg": `url(${JSON.stringify(COMBINED_GUESTS_GROUPS_BG)})`,
  } as CSSProperties
  const merged = mergeGuestsAndGroupsSorted(guests, groups)
  const rowCount =
    merged.length > 0 ? Math.ceil(merged.length / gridCols) : 0
  const gridStyle = {
    "--personnel-guests-groups-grid-cols": String(gridCols),
  } as CSSProperties

  return (
    <section
      className="tile tile-personnel-catalog tile-personnel-catalog--guests-groups tile-personnel-catalog--guests-groups-wide tile-personnel-catalog--span-full"
      style={tileStyle}
    >
      <div className="tile-personnel-catalog-inner">
        <h2 className="sc-label wl-home-v2-songs-archive-section-heading tile-personnel-catalog-songs-heading">
          Guests & Groups
        </h2>
        {merged.length === 0 ?
          <p className="tile-personnel-catalog-empty">No entries</p>
        : <ul
            className="tile-personnel-catalog-list tile-personnel-catalog-list--guests-groups-mini-grid"
            aria-label="Guests and groups"
            style={gridStyle}
          >
            {merged.map((item, idx) => {
              const col = idx % gridCols
              const row = Math.floor(idx / gridCols)
              const flushRight = col === gridCols - 1
              const flushBottom =
                rowCount > 0 && row === rowCount - 1
              return (
                <li
                  key={item.guest_id}
                  className="tile-personnel-catalog-item tile-personnel-catalog-guest-group-mini-cell"
                >
                  <Link
                    href={getPersonnelArchiveUrl(item.guest_id)}
                    className={[
                      "tile-personnel-catalog-link",
                      "tile-personnel-catalog-guest-group-mini-tile",
                      flushRight ?
                        "tile-personnel-catalog-guest-group-mini-tile--flush-right"
                      : "",
                      flushBottom ?
                        "tile-personnel-catalog-guest-group-mini-tile--flush-bottom"
                      : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="tile-personnel-catalog-name">
                      {item.guest}
                    </span>
                    {item.guest_instrument ?
                      <span className="tile-personnel-catalog-instrument-chip">
                        <span className="tile-personnel-catalog-instrument">
                          {formatInstrument(item.guest_instrument, { wrapInParens: false })}
                        </span>
                      </span>
                    : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        }
      </div>
    </section>
  )
}
