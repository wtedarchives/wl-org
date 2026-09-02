import { shouldShowSetlistEntryShort } from "@/supabase/functions/_shared/setlist-share-card/entry-display"

export type EchoLiveSong = {
  n: number
  title: string
  tag: string
  hit: boolean
  chip: string
  short?: string
  segue?: string
  result?: string
  showopener_correct?: boolean
  showcloser_correct?: boolean
}

export type EchoLiveSet = {
  label: string
  songs: EchoLiveSong[]
}

export type EchoLiveStanding = {
  rank: number
  name: string
  points: number
  hits: number
  hitsLabel: string
  move: string
  moveLabel: string
  moveDir: "up" | "down" | "none"
  isMe: boolean
}

export type EchoLiveBar = {
  song: string
  count: number
  width: string
  songId?: string
  displayName?: string | null
}

export type EchoLiveEntry = {
  entry_id: string
  entry_song: string
  entry_set: string
  entry_setnum: number
  entry_placement: string | null
  entry_short: string | null
  entry_segue: string | null
}

export type EchoLivePickRow = {
  song: string
  set: string
  setnum: number
  placement: string | null
  score: number | null
  result: string | null
  showopener_correct: boolean
  showcloser_correct: boolean
}

export const ECHO_OVERPICK_PENALTY = 3

export type EchoLivePickScore = {
  raw: number
  extraSongs: number
  penalty: number
  total: number
}

export type EchoLiveModel = {
  stillGoing: boolean
  penaltyLine: string
  liveStandings: EchoLiveStanding[]
  topSongs: EchoLiveBar[]
  topOpeners: EchoLiveBar[]
  topClosers: EchoLiveBar[]
}

const PLAYERS = [
  { name: "jiveleelow", deltas: [3, 3, 0, 2, 0, 3, 2, 0, 2, 2, 3, 3] },
  { name: "echo_ellie", deltas: [3, 2, 2, 0, 0, 0, 2, 3, 0, 3, 3, 3], me: true },
  { name: "thatch_er", deltas: [2, 3, 0, 0, 2, 0, 2, 3, 3, 2, 2, 0] },
  { name: "vasudo_vic", deltas: [3, 2, 3, 0, 0, 2, 0, 2, 0, 3, 3, 0] },
  { name: "hungersite", deltas: [0, 2, 2, 0, 3, 0, 3, 2, 0, 3, 0, 3] },
  { name: "dr_darkness", deltas: [2, 0, 2, 0, 2, 0, 3, 3, 0, 0, 3, 3] },
  { name: "madhu_van", deltas: [0, 3, 2, 3, 0, 0, 2, 0, 2, 2, 0, 3] },
] as const

const TOP_SONGS = [
  { song: "Arcadia", count: 181 },
  { song: "Hungersite", count: 168 },
  { song: "Madhuvan", count: 154 },
  { song: "Tumble", count: 139 },
  { song: "Yeti", count: 131 },
]

const TOP_OPENERS = [
  { song: "Yeti", count: 44 },
  { song: "Time to Flee", count: 38 },
  { song: "Rockdale", count: 29 },
  { song: "Arcadia", count: 21 },
]

const TOP_CLOSERS = [
  { song: "Hot Tea", count: 51 },
  { song: "Jive Lee", count: 33 },
  { song: "Turned Clouds", count: 27 },
  { song: "Slow Ready", count: 18 },
]

/** Design-file snapshot: 7 of 12 songs revealed. */
export const ECHO_LIVE_REVEALED = 7

function standingsNow(revealed: number): EchoLiveStanding[] {
  const rows = PLAYERS.map((player) => {
    let now = 0
    let prev = 0
    let hits = 0
    for (let i = 0; i < revealed; i++) {
      now += player.deltas[i] ?? 0
      if ((player.deltas[i] ?? 0) > 0) hits += 1
      if (i < revealed - 1) prev += player.deltas[i] ?? 0
    }
    return {
      name: player.name,
      isMe: "me" in player && player.me === true,
      points: now,
      prev,
      hits,
    }
  })
  const byNow = [...rows].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name),
  )
  const byPrev = [...rows].sort(
    (a, b) => b.prev - a.prev || a.name.localeCompare(b.name),
  )
  const prevRank = new Map(byPrev.map((player, index) => [player.name, index]))
  return byNow.map((player, index) => {
    const moved = (prevRank.get(player.name) ?? index) - index
    return {
      rank: index + 1,
      name: player.name,
      points: player.points,
      hits: player.hits,
      hitsLabel: `${player.hits} hits`,
      move: moved > 0 ? "▲" : moved < 0 ? "▼" : "",
      moveLabel:
        moved > 0 ? `▲ ${moved}`
        : moved < 0 ? `▼ ${Math.abs(moved)}`
        : "—",
      moveDir: moved > 0 ? "up" : moved < 0 ? "down" : "none",
      isMe: player.isMe,
    }
  })
}

function orderSetKeys(keys: string[]): string[] {
  const unique = [...new Set(keys)]
  const numeric = unique
    .filter((key) => !/^E/i.test(key))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
  const encore = unique
    .filter((key) => /^E/i.test(key))
    .sort(
      (a, b) =>
        Number.parseInt(a.slice(1), 10) - Number.parseInt(b.slice(1), 10),
    )
  return [...numeric, ...encore]
}

function setLabel(set: string): string {
  if (set === "E1") return "Encore"
  if (set === "E2") return "2nd Encore"
  if (set === "E3") return "3rd Encore"
  if (/^E\d+$/i.test(set)) return `Encore ${set.slice(1)}`
  if (/^\d+$/.test(set)) return `Set ${set}`
  return set
}

function placementTag(placement: string | null | undefined): string {
  const value = (placement ?? "").toLowerCase()
  if (value.includes("show closer")) return "show closer"
  if (value.includes("show opener")) return "show opener"
  if (value.includes("opener")) return "opener"
  if (value.includes("closer")) return "closer"
  return ""
}

function scoreAgainstInstance(
  pick: EchoLivePickRow,
  instance: EchoLiveEntry,
): { points: number; result: string } {
  let points = 2
  let result = "correct_song"
  const correctSet = pick.set === instance.entry_set
  let setAndPosition = false
  if (correctSet) {
    points = 4
    result = "correct_song_set"
    setAndPosition = pick.setnum === instance.entry_setnum
    if (setAndPosition) {
      points = 7
      result = "correct_song_set_setnum"
    }
  }

  const userPlacement = pick.placement ?? ""
  const actualPlacement = instance.entry_placement ?? ""
  const placementMatch =
    (userPlacement.includes("Opener") && actualPlacement.includes("Opener")) ||
    (userPlacement.includes("Closer") && actualPlacement.includes("Closer")) ||
    (userPlacement.includes("Encore") && actualPlacement.includes("Encore"))

  if (placementMatch) {
    if (correctSet) {
      if (setAndPosition) {
        points = 10
        result = "correct_song_set_setnum_openercloserencore"
      } else {
        points = 7
        result = "correct_song_set_openercloserencore"
      }
    } else if (points <= 2) {
      points = 5
      result = "correct_song_openercloserencore"
    }
  }

  return { points, result }
}

function livePickOutcome(
  pick: EchoLivePickRow,
  entries: EchoLiveEntry[],
  complete: boolean,
  allPicks: EchoLivePickRow[],
): {
  hit: boolean
  points: number | null
  result?: string
  showopener_correct: boolean
  showcloser_correct: boolean
} {
  if (pick.result) {
    const hit = pick.result !== "not_played"
    return {
      hit,
      points: pick.score ?? (hit ? 0 : complete ? 0 : null),
      result: pick.result,
      showopener_correct: pick.showopener_correct,
      showcloser_correct: pick.showcloser_correct,
    }
  }

  const matches = entries.filter((entry) => entry.entry_song === pick.song)
  if (matches.length === 0) {
    return {
      hit: false,
      points: complete ? 0 : null,
      result: complete ? "not_played" : undefined,
      showopener_correct: false,
      showcloser_correct: false,
    }
  }

  let best = { points: 0, result: "correct_song" }
  for (const instance of matches) {
    const scored = scoreAgainstInstance(pick, instance)
    if (scored.points > best.points) best = scored
  }

  const showopener_correct =
    allPicks[0] === pick && entries[0]?.entry_song === pick.song
  const showcloser_correct =
    complete &&
    allPicks[allPicks.length - 1] === pick &&
    entries[entries.length - 1]?.entry_song === pick.song

  let points = best.points
  if (showopener_correct) points += 3
  if (showcloser_correct) points += 3

  return {
    hit: true,
    points,
    result: best.result,
    showopener_correct,
    showcloser_correct,
  }
}

function chipForPoints(hit: boolean, points: number | null): string {
  if (hit && points != null) return `+${points}`
  if (!hit && points === 0) return "0"
  return ""
}

function segueLabel(segue: string | null | undefined): string {
  if (!segue) return ""
  const extra = segue.replace(/^>\s*/, "").trim()
  return extra ? `→ ${extra}` : "→"
}

function toSets(
  items: Array<{ set: string; song: EchoLiveSong }>,
): EchoLiveSet[] {
  const groups = new Map<string, EchoLiveSong[]>()
  for (const item of items) {
    const songs = groups.get(item.set) ?? []
    songs.push({ ...item.song, n: songs.length + 1 })
    groups.set(item.set, songs)
  }
  return orderSetKeys([...groups.keys()]).map((set) => ({
    label: setLabel(set),
    songs: groups.get(set) ?? [],
  }))
}

export function buildEchoLiveSetlistSets(
  entries: EchoLiveEntry[],
  picks: EchoLivePickRow[],
  complete: boolean,
): EchoLiveSet[] {
  const outcomes = picks.map((pick) => livePickOutcome(pick, entries, complete, picks))
  return toSets(
    entries.map((entry) => {
      const pickIndex = picks.findIndex(
        (pick, index) => pick.song === entry.entry_song && outcomes[index]?.hit,
      )
      const outcome = pickIndex >= 0 ? outcomes[pickIndex] : null
      return {
        set: entry.entry_set,
        song: {
          n: 0,
          title: entry.entry_song,
          tag: placementTag(entry.entry_placement),
          hit: Boolean(outcome?.hit),
          chip: "",
          short:
            shouldShowSetlistEntryShort(entry.entry_song, entry.entry_short) ?
              (entry.entry_short ?? "")
            : "",
          segue: segueLabel(entry.entry_segue),
        },
      }
    }),
  )
}

export function buildEchoLivePickScore(
  picks: EchoLivePickRow[],
  entries: EchoLiveEntry[],
  complete: boolean,
): EchoLivePickScore {
  let raw = 0
  for (const pick of picks) {
    const outcome = livePickOutcome(pick, entries, complete, picks)
    if (outcome.points != null) raw += outcome.points
  }
  const extraSongs = Math.max(0, picks.length - entries.length)
  const penalty = extraSongs * ECHO_OVERPICK_PENALTY
  return {
    raw,
    extraSongs,
    penalty,
    total: raw - penalty,
  }
}

export function buildEchoLivePickSets(
  picks: EchoLivePickRow[],
  entries: EchoLiveEntry[],
  complete: boolean,
): EchoLiveSet[] {
  return toSets(
    picks.map((pick) => {
      const outcome = livePickOutcome(pick, entries, complete, picks)
      return {
        set: pick.set,
        song: {
          n: 0,
          title: pick.song,
          tag: placementTag(pick.placement),
          hit: outcome.hit,
          chip: chipForPoints(outcome.hit, outcome.points),
          result: outcome.result,
          showopener_correct: outcome.showopener_correct,
          showcloser_correct: outcome.showcloser_correct,
        },
      }
    }),
  )
}

function toBars(list: { song: string; count: number }[]): EchoLiveBar[] {
  const max = list[0]?.count || 1
  return list.map((item) => ({
    song: item.song,
    count: item.count,
    width: `${Math.round((item.count / max) * 100)}%`,
  }))
}

export function buildEchoLiveModel(
  revealed = ECHO_LIVE_REVEALED,
): EchoLiveModel {
  const standings = standingsNow(revealed)
  return {
    stillGoing: true,
    penaltyLine:
      "Picks resolve as the setlist comes in. Over-picking costs 3 points a song.",
    liveStandings: standings,
    topSongs: toBars(TOP_SONGS),
    topOpeners: toBars(TOP_OPENERS),
    topClosers: toBars(TOP_CLOSERS),
  }
}
