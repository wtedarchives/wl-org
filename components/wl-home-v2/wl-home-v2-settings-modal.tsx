"use client"

import { useEffect, useId, useState } from "react"
import { Check } from "@phosphor-icons/react"

import { ToggleSwitch } from "@/components/dpro/setlistgame/song-selection/toggle-switch"
import { cn } from "@/lib/utils"
import { useSetlistCombinedRowsPreferenceContext } from "@/components/wl-home-v2/setlist-combined-rows-preference-context"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { WlHomeV2SettingsSetlistPreview } from "@/components/wl-home-v2/wl-home-v2-settings-setlist-preview"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

import "./wl-home-v2-settings.css"

type WlHomeV2SettingsModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
}

export function WlHomeV2SettingsModal({
  open,
  onClose,
  headingId,
}: WlHomeV2SettingsModalProps) {
  const statusId = useId()
  const {
    expandCombinedOnLoad,
    saveExpandCombinedOnLoad,
    preferenceLoading,
    preferenceSaving,
  } = useSetlistCombinedRowsPreferenceContext()

  const [draftExpanded, setDraftExpanded] = useState(expandCombinedOnLoad)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveJustSucceeded, setSaveJustSucceeded] = useState(false)

  useEffect(() => {
    if (open) {
      setDraftExpanded(expandCombinedOnLoad)
      setSaveError(null)
      setSaveJustSucceeded(false)
    }
  }, [open, expandCombinedOnLoad])

  useEffect(() => {
    if (!saveJustSucceeded) return
    const timer = window.setTimeout(() => setSaveJustSucceeded(false), 2000)
    return () => window.clearTimeout(timer)
  }, [saveJustSucceeded])

  useWlHomeV2ScrollLock(open)

  const isDirty = draftExpanded !== expandCombinedOnLoad
  const isSaving = preferenceSaving
  const isLoading = preferenceLoading

  const handleSave = async () => {
    setSaveError(null)
    setSaveJustSucceeded(false)

    if (isDirty) {
      const ok = await saveExpandCombinedOnLoad(draftExpanded)
      if (!ok) {
        setSaveError("Could not save setlist preferences. Try again.")
        return
      }
    }

    setSaveJustSucceeded(true)
  }

  const statusMessage =
    isLoading ? "Loading…"
    : saveError ? saveError
    : isSaving ? "Saving…"
    : null

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={"modal-backdrop" + (open ? " open" : "")}
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="modal modal--wted-request modal--settings"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="wl-home-v2-settings-head">
            <div className="wl-home-v2-settings-head-top">
              <h3 id={headingId}>Settings</h3>
              <div className="wl-home-v2-settings-head-actions">
                <button
                  type="button"
                  className="wbtn"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={cn(
                    "wbtn primary wl-home-v2-settings-save-btn",
                    saveJustSucceeded && "wl-home-v2-settings-save-btn--success",
                  )}
                  disabled={
                    saveJustSucceeded ? false
                    : !isDirty || isLoading || isSaving
                  }
                  onClick={() => void handleSave()}
                  aria-label={saveJustSucceeded ? "Saved" : "Save"}
                >
                  {saveJustSucceeded ?
                    <Check className="size-4 shrink-0" weight="bold" aria-hidden />
                  : "Save"}
                </button>
              </div>
            </div>
            {statusMessage ?
              <p
                id={statusId}
                className={cn(
                  "wl-home-v2-settings-status",
                  saveError && "wl-home-v2-settings-status--error",
                )}
                aria-live="polite"
                role={saveError ? "alert" : undefined}
              >
                {statusMessage}
              </p>
            : null}
          </header>
          <div className="modal-request-body wl-home-v2-settings-body">
            <section className="wl-home-v2-settings-section">
              <h4 className="wl-home-v2-settings-section-title">
                Setlist Preferences
              </h4>
              <p className="wl-home-v2-settings-section-desc">
                Expanded displays all parenthetical songs within a setlist. Condensed
                hides all parenthetical songs for a cleaner listing.
              </p>
              <div className="wl-home-v2-settings-toggle-row">
                <ToggleSwitch
                  showActualSetlist={!draftExpanded}
                  setShowActualSetlist={(condensed) => setDraftExpanded(!condensed)}
                  leftLabel="Expanded"
                  rightLabel="Condensed"
                  wlV2Chrome
                />
              </div>
              <WlHomeV2SettingsSetlistPreview
                expandedByDefault={draftExpanded}
              />
            </section>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
