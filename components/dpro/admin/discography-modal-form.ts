import type { DiscographyAdminRecord } from "@/types/admin"

export type DiscographyFormFields = Omit<
  DiscographyAdminRecord,
  "uuid" | "canon_id"
> & {
  canon_id: string
}

export function emptyDiscographyForm(): DiscographyFormFields {
  return {
    name: "",
    displayname: "",
    artist: "",
    category: "",
    artwork: "",
    canon_id: "0",
    release_date: null,
    coach_notes: null,
  }
}

export function discographyRecordToForm(
  row: DiscographyAdminRecord,
): DiscographyFormFields {
  return {
    name: row.name,
    displayname: row.displayname,
    artist: row.artist,
    category: row.category,
    artwork: row.artwork,
    canon_id: String(row.canon_id),
    release_date: row.release_date,
    coach_notes: row.coach_notes ?? null,
  }
}
