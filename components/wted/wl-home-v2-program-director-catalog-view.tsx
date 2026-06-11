"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { Input } from "@/components/ui/input"
import { ProgramDirectorCatalogAirplayModal } from "@/components/wted/program-director-catalog-airplay-modal"
import { ProgramDirectorCatalogTable } from "@/components/wted/program-director-catalog-table"
import {
  useProgramDirectorCatalogData,
  type ProgramDirectorCatalogRow,
} from "@/hooks/use-program-director-catalog-data"
import {
  filterProgramDirectorCatalogRows,
  normalizeProgramDirectorCatalogSearchQuery,
} from "@/lib/filter-program-director-catalog-rows"
import { cn } from "@/lib/utils"

import "@/components/wted/program-director-catalog.css"

export function WlHomeV2ProgramDirectorCatalogView() {
  const { rows, loading, error } = useProgramDirectorCatalogData()
  const [catalogSearch, setCatalogSearch] = useState("")
  const [selected, setSelected] = useState<ProgramDirectorCatalogRow | null>(
    null,
  )

  const filteredRows = useMemo(
    () => filterProgramDirectorCatalogRows(rows, catalogSearch),
    [rows, catalogSearch],
  )

  const searchNormalized =
    normalizeProgramDirectorCatalogSearchQuery(catalogSearch)
  const performancesHeadline =
    searchNormalized ?
      `${filteredRows.length} of ${rows.length} performances`
    : `${rows.length} performances`

  if (loading) {
    return (
      <WlHomeV2>
        <WlHomeV2PageLoading message="Loading performance catalog…" />
      </WlHomeV2>
    )
  }

  if (error) {
    return (
      <WlHomeV2>
        <div className="wl-home-v2-pd-catalog-error">
          <div className="widget-panel py-10 text-center">
            <p className="text-sm text-white/65">
              Could not load the performance catalog. Please reload the page.
            </p>
          </div>
        </div>
      </WlHomeV2>
    )
  }

  return (
    <WlHomeV2>
      <div className="wl-home-v2-pd-catalog-stage">
        <div className="wl-home-v2-pd-catalog-stage-bg" aria-hidden />

        <div className="wl-home-v2-pd-catalog-content">
          <header className="wl-home-v2-page-lede">
            <h1>Performance Catalog</h1>
            <div className="wl-home-v2-page-lede-body">
              <p>
                Performances from Goose shows that have been chosen for WTED Radio, sorted by song then date.
                Select a row for episodes and song archive.
              </p>
              <p>
                <Link href="/wted/program-director">Back to Episodes</Link>
              </p>
            </div>
          </header>

          <div className="wl-home-v2-pd-catalog-panel-wrap">
            <div className="widget-panel wl-home-v2-pd-catalog-widget-panel">
              <div className="wp-head wl-home-v2-years-shows-wp-head">
                <span className="min-w-0 truncate">
                  {performancesHeadline}
                </span>
                <div className="wl-home-v2-pd-catalog-search-wrap">
                  <div
                    className={cn(
                      "wl-home-v2-pd-catalog-search-field",
                      catalogSearch.length > 0 &&
                        "wl-home-v2-pd-catalog-search-field--has-value",
                    )}
                  >
                    <Input
                      type="text"
                      role="searchbox"
                      inputMode="search"
                      enterKeyHint="search"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Search…"
                      aria-label="Filter performances by song, tour, venue, location, or date"
                      autoComplete="off"
                      spellCheck={false}
                      className="wl-home-v2-pd-catalog-search-input"
                    />
                    {catalogSearch.length > 0 ?
                      <button
                        type="button"
                        className="wl-home-v2-pd-catalog-search-clear"
                        aria-label="Clear search"
                        onClick={() => setCatalogSearch("")}
                      >
                        <span aria-hidden>×</span>
                      </button>
                    : null}
                  </div>
                </div>
              </div>
              <div className="wl-home-v2-years-table-scroll">
                <ProgramDirectorCatalogTable
                  rows={filteredRows}
                  onRowActivate={setSelected}
                />
              </div>
            </div>
          </div>

          <ProgramDirectorCatalogAirplayModal
            open={selected != null}
            row={selected}
            onClose={() => setSelected(null)}
          />
        </div>
      </div>
    </WlHomeV2>
  )
}
