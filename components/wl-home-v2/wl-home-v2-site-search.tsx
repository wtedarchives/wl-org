"use client"

import { useEffect, useRef, useState } from "react"

import { useAuth } from "@/components/auth-context"

import {
  useSiteSearchForm,
  WlHomeV2SiteSearchField,
  WlHomeV2SiteSearchPanelBody,
} from "./wl-home-v2-site-search-form"

const POPOVER_EXIT_MS = 200

/**
 * Desktop header search: compact field under the right nav + results popover.
 */
export function WlHomeV2SiteSearch() {
  const { session } = useAuth()
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    hint,
    panelOpen,
    setPanelOpen,
    submit,
    resetPanel,
  } = useSiteSearchForm(session?.token)

  const rootRef = useRef<HTMLDivElement>(null)
  const [renderPanel, setRenderPanel] = useState(false)
  const [panelVisible, setPanelVisible] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const openPanel = () => {
    clearCloseTimer()
    setRenderPanel(true)
    requestAnimationFrame(() => setPanelVisible(true))
  }

  const closePanel = () => {
    setPanelVisible(false)
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setRenderPanel(false)
      setPanelOpen(false)
      resetPanel()
      closeTimerRef.current = null
    }, POPOVER_EXIT_MS)
  }

  useEffect(() => {
    if (panelOpen) openPanel()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync mount when submit opens panel
  }, [panelOpen])

  useEffect(() => {
    return () => clearCloseTimer()
  }, [])

  useEffect(() => {
    if (!renderPanel) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel()
    }
    const onPointer = (e: MouseEvent) => {
      const el = rootRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) {
        closePanel()
      }
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onPointer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderPanel])

  return (
    <div
      ref={rootRef}
      className="wl-home-v2-site-search wl-home-v2-site-search--desktop"
    >
      <WlHomeV2SiteSearchField
        query={query}
        onQueryChange={setQuery}
        onSubmit={(q) => {
          clearCloseTimer()
          setRenderPanel(true)
          requestAnimationFrame(() => setPanelVisible(true))
          void submit(q)
        }}
      />
      {renderPanel ?
        <div
          className={[
            "wl-home-v2-site-search-popover",
            panelVisible ? "wl-home-v2-site-search-popover--open" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          role="region"
          aria-label="Search results"
        >
          <WlHomeV2SiteSearchPanelBody
            results={results}
            loading={loading}
            error={error}
            hint={hint}
            onNavigate={closePanel}
          />
        </div>
      : null}
    </div>
  )
}
