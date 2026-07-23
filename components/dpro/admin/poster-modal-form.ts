export type { ShowPosterArtist, ShowPosterRecord } from "@/types/admin"
import type { ShowPosterArtist, ShowPosterRecord } from "@/types/admin"

export interface PosterFormFields {
  showIds: string[]
  tourNames: string[]
  artists: ShowPosterArtist[]
  print_run: string
  description: string
  image: string
}

export function emptyPosterForm(): PosterFormFields {
  return {
    showIds: [],
    tourNames: [],
    artists: [],
    print_run: "",
    description: "",
    image: "",
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === "string" && v.trim() !== "")
}

function asArtists(value: unknown): ShowPosterArtist[] {
  if (!Array.isArray(value)) return []
  const out: ShowPosterArtist[] = []
  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const name = typeof row.name === "string" ? row.name : ""
    const link = typeof row.link === "string" ? row.link : ""
    if (!name.trim() && !link.trim()) continue
    out.push({ name, link })
  }
  return out
}

export function posterRecordToForm(record: ShowPosterRecord): PosterFormFields {
  return {
    showIds: asStringArray(record.show),
    tourNames: asStringArray(record.tour),
    artists: asArtists(record.artist),
    print_run:
      record.print_run == null ? "" : String(record.print_run),
    description: record.description ?? "",
    image: record.image ?? "",
  }
}

export function posterFormToPayload(form: PosterFormFields): {
  show: string[] | null
  tour: string[] | null
  artist: ShowPosterArtist[] | null
  print_run: number | null
  description: string | null
  image: string | null
} {
  const show = form.showIds.filter(Boolean)
  const tour = form.tourNames.filter(Boolean)
  const artist = form.artists
    .map((a) => ({ name: a.name.trim(), link: a.link.trim() }))
    .filter((a) => a.name || a.link)

  let print_run: number | null = null
  const printRaw = form.print_run.trim()
  if (printRaw !== "") {
    const n = Number.parseInt(printRaw, 10)
    if (!Number.isNaN(n)) print_run = n
  }

  const description = form.description.trim()
  const image = form.image.trim()

  return {
    show: show.length ? show : null,
    tour: tour.length ? tour : null,
    artist: artist.length ? artist : null,
    print_run,
    description: description || null,
    image: image || null,
  }
}
