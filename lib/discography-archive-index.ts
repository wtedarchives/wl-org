import { DISCOGRAPHY_PUBLIC_CATEGORIES } from "@/lib/discography-public"

export type DiscographyArchiveIndexRow = {
  uuid: string
  name: string | null
  displayname: string
  artwork: string | null
  canon_id: number
  category: string
}

/** Side Projects only: hyphen surrounded by spaces → en dash (U+2013). */
export function formatSideProjectName(name: string): string {
  return name.replace(/ - /g, " – ")
}

export function sideProjectSortKey(row: DiscographyArchiveIndexRow): string {
  const n = row.name?.trim()
  if (n) return formatSideProjectName(n)
  return row.displayname.trim()
}

export function discographyRowLinkLabel(
  item: DiscographyArchiveIndexRow,
  category: string,
): string {
  if (category === "Side Projects") {
    const n = item.name?.trim()
    if (n) return formatSideProjectName(n)
    return item.displayname
  }
  return item.displayname
}

export function buildDiscographyRowsByCategory(
  items: readonly DiscographyArchiveIndexRow[],
): Map<string, DiscographyArchiveIndexRow[]> {
  const map = new Map<string, DiscographyArchiveIndexRow[]>()
  for (const c of DISCOGRAPHY_PUBLIC_CATEGORIES) {
    map.set(c, [])
  }
  for (const item of items) {
    const list = map.get(item.category)
    if (list) list.push(item)
  }
  const sideProjects = map.get("Side Projects")
  if (sideProjects?.length) {
    sideProjects.sort((a, b) =>
      sideProjectSortKey(a).localeCompare(sideProjectSortKey(b), undefined, {
        sensitivity: "base",
      }),
    )
  }
  return map
}

export function discographyArchiveSearchHits(
  rows: readonly DiscographyArchiveIndexRow[],
  query: string,
): DiscographyArchiveIndexRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...rows]
  return rows.filter((r) => {
    const label = discographyRowLinkLabel(r, r.category).toLowerCase()
    const cat = r.category.toLowerCase()
    const name = (r.name ?? "").toLowerCase()
    const disp = r.displayname.toLowerCase()
    return (
      label.includes(q) ||
      cat.includes(q) ||
      name.includes(q) ||
      disp.includes(q)
    )
  })
}
