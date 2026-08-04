"use client"

import { useEffect } from "react"

import { useAuth } from "@/components/auth-context"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

import {
  useSiteSearchForm,
  WlHomeV2SiteSearchField,
  WlHomeV2SiteSearchPanelBody,
} from "./wl-home-v2-site-search-form"

type WlHomeV2SiteSearchModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
}

export function WlHomeV2SiteSearchModal({
  open,
  onClose,
  headingId,
}: WlHomeV2SiteSearchModalProps) {
  useWlHomeV2ScrollLock(open)
  const { session } = useAuth()

  const {
    query,
    setQuery,
    results,
    loading,
    error,
    hint,
    submit,
    resetPanel,
  } = useSiteSearchForm(session?.token)

  useEffect(() => {
    if (!open) {
      resetPanel()
      setQuery("")
    }
  }, [open, resetPanel, setQuery])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        id="site-search-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--site-search"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Search</h3>
            </div>
            <button
              type="button"
              className="modal-request-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="modal-request-body modal-site-search-body">
            <WlHomeV2SiteSearchField
              query={query}
              onQueryChange={setQuery}
              onSubmit={(q) => void submit(q)}
              autoFocus={open}
            />
            {loading || error || hint || results ?
              <div className="wl-home-v2-site-search-modal-results">
                <WlHomeV2SiteSearchPanelBody
                  results={results}
                  loading={loading}
                  error={error}
                  hint={hint}
                  onNavigate={onClose}
                />
              </div>
            : null}
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
