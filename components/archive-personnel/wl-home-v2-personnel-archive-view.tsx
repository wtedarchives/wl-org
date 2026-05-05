"use client"

import type { CSSProperties } from "react"
import { useLayoutEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  type BreadcrumbItem,
} from "@/components/setlist-breadcrumb-context"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import {
  type WlHomePersonnelCatalogRow,
  useWlHomePersonnelCatalog,
} from "@/hooks/use-wl-home-personnel-catalog"
import { isSupabaseConfigured } from "@/lib/supabase"
import { formatInstrument } from "@/lib/personnel-utils"
import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"

const GUEST_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type PersonnelTileKey = "current" | "former" | "guests" | "groups"

/** Same assets / quadrant order as homepage `#tileGrid`: radio, community, archive, profile. */
const PERSONNEL_TILE_BACKGROUNDS: Record<
  PersonnelTileKey,
  `/newbg.png` | `/newbg2.jpeg` | `/newbg3.jpeg` | `/newbg4.jpeg`
> = {
  current: "/newbg.png",
  former: "/newbg2.jpeg",
  guests: "/newbg3.jpeg",
  groups: "/newbg4.jpeg",
}

const PERSONNEL_TILES: readonly {
  key: PersonnelTileKey
  label: string
  showInstrument: boolean
}[] = [
  { key: "current", label: "Current Goose Members", showInstrument: true },
  { key: "former", label: "Former Goose Members", showInstrument: true },
  { key: "guests", label: "Guests", showInstrument: true },
  { key: "groups", label: "Groups", showInstrument: false },
]

const PERSONNEL_BREADCRUMBS: BreadcrumbItem[] = [
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  { label: "Personnel", href: "/archive/personnel" },
]

/** Headshot assets for homepage-style mini icons (`/public/big-*.png`). */
function getPersonnelCurrentBigPortraitSrc(guestDisplayName: string): string | null {
  const name = guestDisplayName.trim().toLowerCase()
  if (name.includes("cotter")) return "/big-cotter.png"
  if (name.includes("anspach")) return "/big-peter.png"
  if (name.includes("mitarotonda")) return "/big-rick.png"
  if (name.includes("weeks")) return "/big-trevor.png"
  return null
}

function PersonnelCatalogTile({
  tileKey,
  label,
  showInstrument,
  items,
  scrollPanelStyle = false,
}: {
  tileKey: PersonnelTileKey
  label: string
  showInstrument: boolean
  items: WlHomePersonnelCatalogRow[]
  scrollPanelStyle?: boolean
}) {
  const tileBg = PERSONNEL_TILE_BACKGROUNDS[tileKey]
  const tileStyle = {
    "--tile-bg": `url(${JSON.stringify(tileBg)})`,
  } as CSSProperties
  const personnelCurrentRowCount =
    tileKey === "current" ? Math.ceil(items.length / 2) : 0
  const personnelFormerRowCount =
    tileKey === "former" ? Math.ceil(items.length / 3) : 0

  if (scrollPanelStyle) {
    return (
      <section
        className="tile tile-personnel-catalog tile-personnel-catalog--panel-scroll"
        style={tileStyle}
      >
        <div className="tile-personnel-catalog-inner">
          <h2 className="sc-label wl-home-v2-songs-archive-section-heading tile-personnel-catalog-songs-heading">
            {label}
          </h2>
          <div className="widget-panel tile-personnel-catalog-widget-panel">
            {items.length === 0 ?
              <p className="tile-personnel-catalog-panel-empty">No entries</p>
            : <div className="tile-personnel-catalog-panel-scroll-mount">
                {items.map((item) => (
                  <Link
                    key={item.guest_id}
                    href={getPersonnelArchiveUrl(item.guest_id)}
                    className="topic-row tile-personnel-catalog-panel-topic"
                  >
                    <span className="tile-personnel-catalog-panel-topic-body">
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
                    </span>
                  </Link>
                ))}
              </div>
            }
          </div>
        </div>
      </section>
    )
  }

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
            {items.map((item, idx) => {
              const row = Math.floor(idx / 2)
              const flushRight = idx % 2 === 1
              const flushBottom =
                personnelCurrentRowCount > 0 && row === personnelCurrentRowCount - 1
              const portraitSrc = getPersonnelCurrentBigPortraitSrc(item.guest)
              return (
                <li
                  key={item.guest_id}
                  className="tile-personnel-catalog-item tile-personnel-catalog-current-mini-cell"
                >
                  <Link
                    href={getPersonnelArchiveUrl(item.guest_id)}
                    className={[
                      "tile-personnel-catalog-link",
                      "tile-personnel-catalog-current-mini-tile",
                      flushRight ?
                        "tile-personnel-catalog-current-mini-tile--flush-right"
                      : "",
                      flushBottom ?
                        "tile-personnel-catalog-current-mini-tile--flush-bottom"
                      : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
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
            {items.map((item, idx) => {
              const col = idx % 3
              const row = Math.floor(idx / 3)
              const flushRight = col === 2
              const flushBottom =
                personnelFormerRowCount > 0 && row === personnelFormerRowCount - 1
              return (
                <li
                  key={item.guest_id}
                  className="tile-personnel-catalog-item tile-personnel-catalog-former-mini-cell"
                >
                  <Link
                    href={getPersonnelArchiveUrl(item.guest_id)}
                    className={[
                      "tile-personnel-catalog-link",
                      "tile-personnel-catalog-former-mini-tile",
                      flushRight ?
                        "tile-personnel-catalog-former-mini-tile--flush-right"
                      : "",
                      flushBottom ?
                        "tile-personnel-catalog-former-mini-tile--flush-bottom"
                      : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
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
              )
            })}
          </ul>
        : <ul className="tile-personnel-catalog-list">
            {items.map((item) => (
              <li key={item.guest_id} className="tile-personnel-catalog-item">
                <Link
                  href={getPersonnelArchiveUrl(item.guest_id)}
                  className="tile-personnel-catalog-link"
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
        }
      </div>
    </section>
  )
}

/** Personnel index — homepage-style 2×2 tile grid; detail `?id=` redirects to legacy detail route. */
export function WlHomeV2PersonnelArchiveView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const openArchiveHub = useWlHomeV2OpenArchiveHub()

  const idParam =
    [...searchParams.getAll("id")].map((s) => s.trim()).filter(Boolean)[0]
    ?? ""

  const showGrid = !idParam

  useLayoutEffect(() => {
    if (!idParam) return
    const q = `/old/archive/personnel?id=${encodeURIComponent(idParam)}`
    if (GUEST_ID_RE.test(idParam)) {
      router.replace(q)
    } else {
      router.replace("/archive/personnel")
    }
  }, [idParam, router])

  const { byKey, loading, error } = useWlHomePersonnelCatalog(showGrid)

  if (
    (!isSupabaseConfigured() || error) &&
    showGrid &&
    !loading
  ) {
    return (
      <div className="wl-home-v2-personnel-archive-page flex min-h-0 min-w-0 flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
        <WlHomeV2ArchiveCrumbsShell
          variant="page-gutter"
          trail={
            <WlHomeV2ArchiveCrumbsTrail
              items={PERSONNEL_BREADCRUMBS}
              openArchiveHub={openArchiveHub ?? undefined}
            />
          }
        />
        <div className="widget-panel mt-4 py-10 text-center">
          <p className="text-sm text-white/65">
            Trouble communicating with the database server. Please reload the
            page.
          </p>
        </div>
      </div>
    )
  }

  if (loading && showGrid) {
    return (
      <div className="wl-home-v2-personnel-archive-page flex min-h-0 min-w-0 flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
        <WlHomeV2ArchiveCrumbsShell
          variant="page-gutter"
          trail={
            <WlHomeV2ArchiveCrumbsTrail
              items={PERSONNEL_BREADCRUMBS}
              openArchiveHub={openArchiveHub ?? undefined}
            />
          }
        />
        <WlHomeV2PageLoading message="Loading personnel…" />
      </div>
    )
  }

  /** Redirect branch: avoid flashing grid behind legacy detail navigation. */
  if (!showGrid) {
    return (
      <div className="wl-home-v2-personnel-archive-page flex min-h-0 min-w-0 flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
        <WlHomeV2PageLoading message="Opening personnel…" />
      </div>
    )
  }

  return (
    <div className="wl-home-v2-personnel-archive-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden rounded-b-none px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
      <WlHomeV2ArchiveCrumbsShell
        variant="page-gutter"
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={PERSONNEL_BREADCRUMBS}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
      />
      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <section
          className="grid"
          id="tileGrid"
          aria-label="Personnel categories"
        >
          {PERSONNEL_TILES.map(({ key, label, showInstrument }) => (
            <PersonnelCatalogTile
              key={key}
              tileKey={key}
              label={label}
              showInstrument={showInstrument}
              items={byKey[key] ?? []}
              scrollPanelStyle={key === "guests" || key === "groups"}
            />
          ))}
        </section>
      </div>
    </div>
  )
}
