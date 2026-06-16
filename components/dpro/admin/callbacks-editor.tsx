"use client"

import { useRef } from "react"
import type { AdminShowData } from "@/types/admin"
import {
  AdminHtmlLinkInserters,
  insertTextAtTextareaCursor,
  type AdminHtmlLinkSong,
} from "./admin-html-link-inserters"

interface CallbacksEditorProps {
  selectedShow: AdminShowData
  editedShow: AdminShowData | null
  isEditing: boolean
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  allShows: AdminShowData[]
  songs: AdminHtmlLinkSong[]
}

export function CallbacksEditor({
  selectedShow,
  editedShow,
  isEditing,
  onInputChange,
  allShows,
  songs,
}: CallbacksEditorProps) {
  const callbacksTextareaRef = useRef<HTMLTextAreaElement>(null)

  const insertAtCursor = (text: string, cursorOffset?: number) => {
    if (!editedShow) return
    insertTextAtTextareaCursor(
      callbacksTextareaRef.current,
      text,
      editedShow.show_callbacks ?? "",
      (newValue) => {
        onInputChange({
          target: { name: "show_callbacks", value: newValue },
        } as React.ChangeEvent<HTMLTextAreaElement>)
      },
      cursorOffset,
    )
  }

  if (!selectedShow?.show_callbacks && !isEditing) return null

  return (
    <div className="wl-home-v2-archive-admin-song-form__notes space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="show-admin-callbacks">Callbacks</label>

        {isEditing ?
          <AdminHtmlLinkInserters
            allShows={allShows}
            songs={songs}
            onInsert={insertAtCursor}
            showInsertArrow
            showInsertLineBreak
          />
        : null}
      </div>

      {isEditing ?
        <textarea
          ref={callbacksTextareaRef}
          id="show-admin-callbacks"
          name="show_callbacks"
          value={editedShow?.show_callbacks ?? ""}
          onChange={onInputChange}
          rows={4}
          className="font-mono"
          placeholder="Enter callbacks HTML..."
        />
      : <div
          className="min-h-[100px] w-full rounded-md border border-input bg-muted/30 px-2 py-1.5 text-xs [&_a]:font-medium [&_a]:text-primary [&_a]:underline"
          dangerouslySetInnerHTML={{
            __html: selectedShow.show_callbacks ?? "",
          }}
        />
      }
    </div>
  )
}
