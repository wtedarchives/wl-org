"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { invokeDproAdmin } from "@/lib/dpro-admin-edge"
import type { AdminShowData } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(c) => onCheckedChange(c === true)}
      />
      <Label htmlFor={id} className="cursor-pointer font-normal">
        {label}
      </Label>
    </div>
  )

  return (
    <div className="mt-6 space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4 transition-opacity duration-200">
      <h4 className="text-sm font-medium">Completion Badges</h4>
      <div className="flex flex-col gap-3 sm:max-w-md">
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
        <div className="space-y-1.5">
          <Label htmlFor="show_listcategorycomplete" className="text-xs">
            Album category completed
          </Label>
          <Input
            id="show_listcategorycomplete"
            value={showListCategoryComplete}
            onChange={(e) => setShowListCategoryComplete(e.target.value)}
            placeholder="Category name or leave empty for null"
            className="h-9 text-sm"
          />
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => void handleSave()}
        disabled={saving}
        className="min-h-11 sm:min-h-9"
      >
        {saving ? "Saving…" : "Save flags"}
      </Button>
    </div>
  )
}
