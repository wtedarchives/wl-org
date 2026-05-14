"use client"

import { useEffect, useState } from "react"
import { FloppyDisk } from "@phosphor-icons/react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import type { AdminShowData } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ShowCompletionFlagsSectionProps {
  show: AdminShowData
  onSaveSuccess: (patch: Partial<AdminShowData>) => void
  onRefreshShows: () => void
}

export function ShowCompletionFlagsSection({
  show,
  onSaveSuccess,
  onRefreshShows,
}: ShowCompletionFlagsSectionProps) {
  const { session } = useAuth()
  const token = session?.token ?? null
  const [showSetlistComplete, setShowSetlistComplete] = useState(false)
  const [discographyDisplay, setDiscographyDisplay] = useState(false)
  const [showDripfieldComplete, setShowDripfieldComplete] = useState(false)
  const [showJiveComplete, setShowJiveComplete] = useState(false)
  const [showListCategoryComplete, setShowListCategoryComplete] =
    useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setShowSetlistComplete(show.show_setlistcomplete === true)
    setDiscographyDisplay(show.discography_display === true)
    setShowDripfieldComplete(show.show_dripfieldcomplete === true)
    setShowJiveComplete(show.show_jivecomplete === true)
    setShowListCategoryComplete(show.show_listcategorycomplete ?? "")
  }, [
    show.show_id,
    show.show_setlistcomplete,
    show.discography_display,
    show.show_dripfieldcomplete,
    show.show_jivecomplete,
    show.show_listcategorycomplete,
  ])

  const handleSave = async () => {
    if (!token) {
      toast.error("You must be signed in.")
      return
    }
    setSaving(true)
    try {
      const listCat = showListCategoryComplete.trim()
      const patch = {
        show_setlistcomplete: showSetlistComplete,
        discography_display: discographyDisplay,
        show_dripfieldcomplete: showDripfieldComplete,
        show_jivecomplete: showJiveComplete,
        show_listcategorycomplete: listCat === "" ? null : listCat,
      }
      const { error } = await invokeDproAdmin(token, {
        action: "shows_update",
        show_id: show.show_id,
        patch,
      })
      if (error) throw new Error(error)
      onSaveSuccess(patch)
      onRefreshShows()
      toast.success("Completion flags saved.")
    } catch (e) {
      console.error(e)
      toast.error(
        e instanceof Error ? e.message : "Could not save completion flags.",
      )
    } finally {
      setSaving(false)
    }
  }

  const flagRow = (
    id: string,
    label: string,
    checked: boolean,
    onCheckedChange: (v: boolean) => void,
  ) => (
    <div className="wl-home-v2-archive-admin-show-completion__flag-row">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="size-4 shrink-0 rounded"
      />
      <label htmlFor={id}>{label}</label>
    </div>
  )

  return (
    <div className="wl-home-v2-archive-admin-show-completion">
      <div className="wl-home-v2-archive-admin-song-form__head">
        <div
          role="heading"
          aria-level={3}
          className="wl-home-v2-archive-admin-song-form__section-label"
        >
          Completion Badges
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void handleSave()}
          disabled={saving}
          className="wl-home-v2-tours-header-pill shrink-0 gap-1"
        >
          <FloppyDisk className="size-3.5 shrink-0 opacity-80" aria-hidden />
          {saving ? "Saving…" : "Save flags"}
        </Button>
      </div>
      <div className="wl-home-v2-archive-admin-song-form__grid">
        <div className="wl-home-v2-archive-admin-show-completion__flags">
          {flagRow(
            "show_setlistcomplete",
            "Setlist complete",
            showSetlistComplete,
            setShowSetlistComplete,
          )}
          {flagRow(
            "discography_display",
            "Display in discography",
            discographyDisplay,
            setDiscographyDisplay,
          )}
          {flagRow(
            "show_dripfieldcomplete",
            "Dripfield Suite complete",
            showDripfieldComplete,
            setShowDripfieldComplete,
          )}
          {flagRow(
            "show_jivecomplete",
            "Jive Suite complete",
            showJiveComplete,
            setShowJiveComplete,
          )}
        </div>
        <div className="wl-home-v2-archive-admin-song-form__notes min-w-0">
          <label htmlFor="show_listcategorycomplete">
            Album category completed
          </label>
          <Input
            id="show_listcategorycomplete"
            value={showListCategoryComplete}
            onChange={(e) => setShowListCategoryComplete(e.target.value)}
            placeholder="Category name or leave empty for null"
          />
        </div>
      </div>
    </div>
  )
}
