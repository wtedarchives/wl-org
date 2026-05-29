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
  const [saveError, setSaveError] = useState(false)
  const [saveJustSucceeded, setSaveJustSucceeded] = useState(false)

  useEffect(() => {
    if (open) {
      setDraftExpanded(expandCombinedOnLoad)
      setSaveError(false)
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

  const handleSave = async () => {
    setSaveError(false)
    setSaveJustSucceeded(false)
    const ok = await saveExpandCombinedOnLoad(draftExpanded)
    if (!ok) {
      setSaveError(true)
      return
    }
    setSaveJustSucceeded(true)
  }

  const statusMessage =
    preferenceLoading ? "Loading…"
    : saveError ? "Could not save. Try again."
    : preferenceSaving ? "Saving…"
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
                  disabled={preferenceSaving}
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
                    : !isDirty || preferenceLoading || preferenceSaving
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
                className="wl-home-v2-settings-status"
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
                Song pairs, reprises, and suites can appear as one combined row or as separate
                song rows. Choose how they look when you open a setlist.
              </p>
              <div className="wl-home-v2-settings-toggle-row">
                <ToggleSwitch
                  showActualSetlist={draftExpanded}
                  setShowActualSetlist={setDraftExpanded}
                  leftLabel="Combined"
                  rightLabel="Expanded"
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
