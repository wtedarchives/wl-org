export type PersonnelSearchGuestRow = {
  guest_id: string
  guest: string
  guest_instrument: string | null
}

/** Same pattern as {@link songsArchiveSearchHits}: optional filter, sort, cap 60. */
export function personnelArchiveSearchHits(
  rows: readonly PersonnelSearchGuestRow[],
  query: string,
): PersonnelSearchGuestRow[] {
  const q = query.trim().toLowerCase()
  let list = [...rows]
  if (q) {
    list = list.filter((r) => {
      const name = r.guest.toLowerCase()
      const inst = (r.guest_instrument ?? "").toLowerCase()
      return name.includes(q) || inst.includes(q)
    })
  }
  list.sort((a, b) => a.guest.localeCompare(b.guest))
  return list.slice(0, 60)
}
