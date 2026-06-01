"use client"

import { useEffect, useId, useState } from "react"
import { Check } from "@phosphor-icons/react"

import { ToggleSwitch } from "@/components/dpro/setlistgame/song-selection/toggle-switch"
import { useAuth } from "@/components/auth-context"
import { cn } from "@/lib/utils"
import { useSetlistCombinedRowsPreferenceContext } from "@/components/wl-home-v2/setlist-combined-rows-preference-context"
import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { WlHomeV2SettingsSetlistPreview } from "@/components/wl-home-v2/wl-home-v2-settings-setlist-preview"
import { usePushNotificationsPreference } from "@/hooks/use-push-notifications-preference"
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
  const { session } = useAuth()
  const {
    expandCombinedOnLoad,
    saveExpandCombinedOnLoad,
    preferenceLoading,
    preferenceSaving,
  } = useSetlistCombinedRowsPreferenceContext()
  const {
    pushEnabled,
    savePushEnabled,
    loading: pushLoading,
    saving: pushSaving,
    supportState,
  } = usePushNotificationsPreference(session?.profileId, session?.token)

  const [draftExpanded, setDraftExpanded] = useState(expandCombinedOnLoad)
  const [draftPushEnabled, setDraftPushEnabled] = useState(pushEnabled)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveJustSucceeded, setSaveJustSucceeded] = useState(false)

  useEffect(() => {
    if (open) {
      setDraftExpanded(expandCombinedOnLoad)
      setDraftPushEnabled(pushEnabled)
      setSaveError(null)
      setSaveJustSucceeded(false)
    }
  }, [open, expandCombinedOnLoad, pushEnabled])

  useEffect(() => {
    if (!saveJustSucceeded) return
    const timer = window.setTimeout(() => setSaveJustSucceeded(false), 2000)
    return () => window.clearTimeout(timer)
  }, [saveJustSucceeded])

  useWlHomeV2ScrollLock(open)

  const setlistDirty = draftExpanded !== expandCombinedOnLoad
  const pushDirty = draftPushEnabled !== pushEnabled
  const isDirty = setlistDirty || pushDirty
  const isSaving = preferenceSaving || pushSaving
  const isLoading = preferenceLoading || pushLoading

  const handleSave = async () => {
    setSaveError(null)
    setSaveJustSucceeded(false)

    if (setlistDirty) {
      const ok = await saveExpandCombinedOnLoad(draftExpanded)
      if (!ok) {
        setSaveError("Could not save setlist preferences. Try again.")
        return
      }
    }

    if (pushDirty) {
      const result = await savePushEnabled(draftPushEnabled)
      if (!result.ok) {
        setSaveError(result.error)
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

  const pushUnsupported = supportState === "unsupported"
  const pushBlocked = supportState === "blocked"

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

            <section className="wl-home-v2-settings-section">
              <h4 className="wl-home-v2-settings-section-title">
                Live Show Notifications
              </h4>
              <p className="wl-home-v2-settings-section-desc">
                Get desktop alerts when a live show is announced on stage, during breaks, and
                for each song while we are tracking the setlist.
              </p>
              {pushUnsupported ?
                <p className="wl-home-v2-settings-section-desc">
                  Push notifications are not supported in this browser.
                </p>
              : pushBlocked ?
                <p className="wl-home-v2-settings-section-desc">
                  Notifications are blocked for this site. Allow notifications in your browser
                  settings, then try again.
                </p>
              : <>
                  <div className="wl-home-v2-settings-toggle-row">
                    <ToggleSwitch
                      showActualSetlist={draftPushEnabled}
                      setShowActualSetlist={setDraftPushEnabled}
                      leftLabel="Off"
                      rightLabel="On"
                      wlV2Chrome
                    />
                  </div>
                  <p className="wl-home-v2-settings-preview__caption">
                    Example — Title: ♫ Now Playing: Arcadia · Body: 06.23.24 (Charlotte, NC)
                    then Encore, Song 1 on the next line.
                  </p>
                </>
              }
            </section>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
