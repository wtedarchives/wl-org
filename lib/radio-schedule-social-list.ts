import { RADIO_SCHEDULES_STORAGE_BUCKET } from "@/lib/radio-schedule-share-upload"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"
import { buildRadioScheduleShareExportDayOptions } from "@/lib/wl-home-v2-radio-schedule-share-export-days"

export type RadioScheduleSocialImage = {
  dayKey: string
  label: string
  filename: string
  publicUrl: string
  storagePath: string
}

function isStoragePngFile(name: string | undefined, id: string | null | undefined): boolean {
  return Boolean(name && id && /\.png$/i.test(name))
}

/** Today plus the next three local days — list PNGs in each `YYYY-MM-DD/` folder. */
export async function fetchRadioScheduleSocialImages(
  anchor: Date = new Date(),
): Promise<{ items: RadioScheduleSocialImage[]; error: string | null }> {
  if (!supabase || !isSupabaseConfigured()) {
    return { items: [], error: "Missing Supabase configuration." }
  }

  const dayOptions = buildRadioScheduleShareExportDayOptions(anchor)
  const items: RadioScheduleSocialImage[] = []

  for (const opt of dayOptions) {
    const { data, error } = await supabase.storage
      .from(RADIO_SCHEDULES_STORAGE_BUCKET)
      .list(opt.key, { limit: 20, sortBy: { column: "name", order: "asc" } })

    if (error) {
      return { items: [], error: error.message }
    }

    const file = (data ?? []).find((entry) =>
      isStoragePngFile(entry.name, entry.id),
    )
    if (!file?.name) continue

    const storagePath = `${opt.key}/${file.name}`
    const { data: urlData } = supabase.storage
      .from(RADIO_SCHEDULES_STORAGE_BUCKET)
      .getPublicUrl(storagePath)

    items.push({
      dayKey: opt.key,
      label: opt.label,
      filename: file.name,
      publicUrl: urlData.publicUrl,
      storagePath,
    })
  }

  return { items, error: null }
}

export async function downloadRadioScheduleSocialImage(
  item: Pick<RadioScheduleSocialImage, "publicUrl" | "filename">,
): Promise<void> {
  const res = await fetch(item.publicUrl)
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement("a")
    a.href = url
    a.download = item.filename
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}
