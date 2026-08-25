import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Shorts that `update_song_tour_counts()` excludes from the gap math, and whose
 * own entries it nulls out. Kept identical to the three copies of this list
 * inside that function — a divergence here shows up as a Discourse post whose
 * number contradicts the Last column.
 */
const GAP_EXCLUDED_SHORTS = ["fake", "tease", "reprise", "aborted"]

/** Never counts as a performance, in the DB function or here. */
const IMPROV_JAM = "[Improv/Jam]"

/**
 * Shows since this song was last played, or a debut. `null` means the entry has
 * no defensible number — the show isn't canon, or the entry is an excluded
 * short — and is the same set of rows the Last column leaves blank.
 */
export type SetlistShowGap =
  | { kind: "gap"; shows: number }
  | { kind: "debut" }
  | null

/**
 * Live equivalent of `setlist_entries.last_count`, minus the TD/LIB suffixes.
 *
 * The stored column is only correct once `update_song_tour_counts()` has run
 * across every entry (~30–45s, and rate-limited from Brains), so during a live
 * show the row being announced is exactly the one whose value is stale. This
 * recomputes just the number, which needs no year-gap or tour analysis:
 * canon shows are numbered contiguously, so the difference between two
 * `show_canonid`s *is* the show count between them.
 *
 * Verified against the stored column on completed shows — every non-null
 * `last_count` matches, including rows carrying `, TD`.
 */
export async function loadSetlistShowGap(
  db: SupabaseClient,
  entryId: string,
): Promise<SetlistShowGap> {
  const { data: entry, error: entryErr } = await db
    .from("setlist_entries")
    .select("entry_show, entry_song, entry_short")
    .eq("entry_id", entryId)
    .maybeSingle()
  if (entryErr) {
    console.error("setlist show gap entry:", entryErr.message)
    return null
  }
  if (!entry) return null

  const song = ((entry.entry_song as string | null) ?? "").trim()
  const short = ((entry.entry_short as string | null) ?? "").trim().toLowerCase()
  if (!song || song === IMPROV_JAM) return null
  if (GAP_EXCLUDED_SHORTS.includes(short)) return null

  const { data: show, error: showErr } = await db
    .from("shows")
    .select("show_canonid, show_iscanon")
    .eq("show_id", entry.entry_show as string)
    .maybeSingle()
  if (showErr) {
    console.error("setlist show gap show:", showErr.message)
    return null
  }
  // A non-canon show has no canonid, so there is nothing to count from. These
  // are the entries the Last column leaves blank rather than calling a debut.
  const canonId = show?.show_canonid as number | null | undefined
  if (!show || show.show_iscanon !== true || typeof canonId !== "number") {
    return null
  }

  // Every prior canon appearance of this song. Unordered and unlimited because
  // PostgREST can only order by an embedded column *within* the embed, not the
  // parent rows — so the max is taken below instead. The heaviest song in the
  // archive returns ~215 two-column rows, which is cheaper than the round trip.
  const { data: prior, error: priorErr } = await db
    .from("setlist_entries")
    .select("entry_short, shows!inner(show_canonid, show_iscanon)")
    .eq("entry_song", song)
    .eq("shows.show_iscanon", true)
    .lt("shows.show_canonid", canonId)
  if (priorErr) {
    console.error("setlist show gap prior:", priorErr.message)
    return null
  }

  type PriorRow = {
    entry_short: string | null
    shows: { show_canonid: number | null } | null
  }
  let lastCanonId: number | null = null
  for (const row of (prior ?? []) as unknown as PriorRow[]) {
    const rowShort = (row.entry_short ?? "").trim().toLowerCase()
    if (GAP_EXCLUDED_SHORTS.includes(rowShort)) continue
    const rowCanonId = row.shows?.show_canonid
    if (typeof rowCanonId !== "number") continue
    if (lastCanonId === null || rowCanonId > lastCanonId) lastCanonId = rowCanonId
  }

  if (lastCanonId === null) return { kind: "debut" }
  return { kind: "gap", shows: canonId - lastCanonId }
}

/**
 * Parenthetical for the announcement copy, or `null` when the entry has no
 * number to show. Discourse appends it to the song line; Bluesky gives it its
 * own line above the coach notes.
 */
export function formatSetlistShowGap(gap: SetlistShowGap): string | null {
  if (!gap) return null
  if (gap.kind === "debut") return "(song debut)"
  return `(${gap.shows} show gap)`
}
