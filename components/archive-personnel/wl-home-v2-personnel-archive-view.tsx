"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { notFound, useSearchParams } from "next/navigation"

import {
  PersonnelCatalogTile,
  PersonnelGuestsGroupsCombinedTile,
  PERSONNEL_TOP_TILES,
} from "@/components/archive-personnel/wl-home-v2-personnel-archive-catalog-tiles"
import { SongsArchiveSearchGlyph } from "@/components/archive-song/wl-home-v2-song-archive-search-glyph"
import {
  personnelArchiveSearchHits,
  type PersonnelSearchGuestRow,
} from "@/components/archive-personnel/personnel-archive-search-helpers"
import { WlHomeV2PersonnelArchiveSearchModal } from "@/components/archive-personnel/wl-home-v2-personnel-archive-search-modal"
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
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { WlHomeV2PersonnelArchiveDetailView } from "@/components/archive-personnel/wl-home-v2-personnel-archive-detail-view"
import {
  useWlHomePersonnelCatalog,
} from "@/hooks/use-wl-home-personnel-catalog"
import { isSupabaseConfigured } from "@/lib/supabase"

const GUEST_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const PERSONNEL_BREADCRUMBS: BreadcrumbItem[] = [
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  { label: "Personnel", href: "/archive/personnel" },
]

const PERSONNEL_CATALOG_KEYS = [
  "current",
  "former",
  "guests",
  "groups",
] as const

/** Personnel index — top row Current | Former; full-width Guests & Groups below. Detail `?id=` matches legacy data (same hook/components as `/old/archive/personnel`). */
export function WlHomeV2PersonnelArchiveView() {
  const searchParams = useSearchParams()
  const openArchiveHub = useWlHomeV2OpenArchiveHub()

  const idResolution = useMemo(() => {
    const idList = searchParams
      .getAll("id")
      .map((s) => s.trim())
      .filter(Boolean)
    if (new Set(idList).size > 1) {
      return { mode: "invalid" as const }
    }
    const idParam = idList[0] ?? ""
    if (!idParam) return { mode: "index" as const }
    if (!GUEST_ID_RE.test(idParam)) return { mode: "invalid" as const }
    return { mode: "detail" as const, guestId: idParam }
  }, [searchParams])

  const catalogEnabled = idResolution.mode === "index"
  const { byKey, loading, error } = useWlHomePersonnelCatalog(catalogEnabled)

  const [personnelIndexSearchOpen, setPersonnelIndexSearchOpen] =
    useState(false)
  const [personnelIndexSearchQuery, setPersonnelIndexSearchQuery] =
    useState("")
  const personnelIndexSearchInputRef = useRef<HTMLInputElement>(null)

  const personnelIndexSearchRows = useMemo((): PersonnelSearchGuestRow[] => {
    if (idResolution.mode !== "index") return []
    const map = new Map<string, PersonnelSearchGuestRow>()
    for (const key of PERSONNEL_CATALOG_KEYS) {
      for (const row of byKey[key] ?? []) {
        map.set(row.guest_id, {
          guest_id: row.guest_id,
          guest: row.guest,
          guest_instrument: row.guest_instrument,
        })
      }
    }
    return [...map.values()]
  }, [idResolution.mode, byKey])

  const personnelIndexSearchHits = useMemo(
    () =>
      personnelArchiveSearchHits(
        personnelIndexSearchRows,
        personnelIndexSearchQuery,
      ),
    [personnelIndexSearchRows, personnelIndexSearchQuery],
  )

  const closePersonnelIndexSearch = useCallback(() => {
    setPersonnelIndexSearchOpen(false)
    setPersonnelIndexSearchQuery("")
  }, [])

  const openPersonnelIndexSearch = useCallback(() => {
    setPersonnelIndexSearchOpen(true)
    setPersonnelIndexSearchQuery("")
  }, [])

  useWlHomeV2ScrollLock(
    personnelIndexSearchOpen && idResolution.mode === "index",
  )

  useEffect(() => {
    if (idResolution.mode !== "index") return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && personnelIndexSearchOpen) {
        setPersonnelIndexSearchOpen(false)
        setPersonnelIndexSearchQuery("")
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPersonnelIndexSearchOpen(true)
        setPersonnelIndexSearchQuery("")
        setTimeout(() => personnelIndexSearchInputRef.current?.focus(), 40)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [personnelIndexSearchOpen, idResolution.mode])

  useEffect(() => {
    if (!personnelIndexSearchOpen || idResolution.mode !== "index") return
    setTimeout(() => personnelIndexSearchInputRef.current?.focus(), 40)
  }, [personnelIndexSearchOpen, idResolution.mode])

  if (idResolution.mode === "invalid") {
    notFound()
  }

  if (idResolution.mode === "detail") {
    return <WlHomeV2PersonnelArchiveDetailView guestId={idResolution.guestId} />
  }

  if ((!isSupabaseConfigured() || error) && !loading) {
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

  if (loading) {
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

  return (
    <div className="wl-home-v2-personnel-archive-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden rounded-b-none px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
      <WlHomeV2ArchiveCrumbsShell
        variant="page-gutter"
        className="wl-home-v2-archive-crumbs-shell--inline-selectors"
        selectorsAriaLabel="Search personnel"
        selectors={
          <button
            type="button"
            className="song-archive-detail-vx__crumbs-search-btn"
            title="Search personnel"
            aria-label="Search personnel"
            onClick={openPersonnelIndexSearch}
          >
            <SongsArchiveSearchGlyph />
            <span>Search</span>
          </button>
        }
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={PERSONNEL_BREADCRUMBS}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
      />

      <WlHomeV2PersonnelArchiveSearchModal
        open={personnelIndexSearchOpen}
        onClose={closePersonnelIndexSearch}
        searchQuery={personnelIndexSearchQuery}
        setSearchQuery={setPersonnelIndexSearchQuery}
        searchHits={personnelIndexSearchHits}
        searchInputRef={personnelIndexSearchInputRef}
      />

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <section
          className="grid"
          id="tileGrid"
          aria-label="Personnel categories"
        >
          {PERSONNEL_TOP_TILES.map(({ key, label, showInstrument }) => (
            <PersonnelCatalogTile
              key={key}
              tileKey={key}
              label={label}
              showInstrument={showInstrument}
              items={byKey[key] ?? []}
            />
          ))}
          <PersonnelGuestsGroupsCombinedTile
            guests={byKey.guests ?? []}
            groups={byKey.groups ?? []}
          />
        </section>
      </div>
    </div>
  )
}
