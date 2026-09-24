export type VoteSong = {
  id: string
  name: string
  set: string
  num: number
}

export type VoteShow = {
  id: string
  dateLabel: string
  venue: string
  location: string
  songs: VoteSong[]
}

function songs(
  showId: string,
  rows: Array<[set: string, num: number, name: string]>,
): VoteSong[] {
  return rows.map(([set, num, name]) => ({
    id: `${showId}-${set}-${num}`,
    name,
    set,
    num,
  }))
}

export const COLORADO_RUN_SHOWS: VoteShow[] = [
  {
    id: "2026-08-27",
    dateLabel: "08.27.26",
    venue: "Red Rocks Park and Amphitheatre",
    location: "Morrison, CO",
    songs: songs("2026-08-27", [
      ["1", 1, "Eminence Front"],
      ["1", 2, "MEDIA"],
      ["1", 3, "Rockdale"],
      ["1", 4, "Silver Rising"],
      ["1", 5, "Strange Overtones"],
      ["1", 6, "Spirit of the Dark Horse → (7hunder)"],
      ["1", 8, "Dragonfly"],
      ["1", 9, "Thatch"],
      ["2", 1, "Madhuvan"],
      ["2", 2, "Fish in the Sea"],
      ["2", 3, "Red Bird"],
      ["2", 4, "Wysteria Lane"],
      ["E1", 1, "POP"],
    ]),
  },
  {
    id: "2026-08-28",
    dateLabel: "08.28.26",
    venue: "Red Rocks Park and Amphitheatre",
    location: "Morrison, CO",
    songs: songs("2026-08-28", [
      ["1", 1, "Bear"],
      ["1", 2, "SOS → (dawn)"],
      ["1", 4, "California Magic"],
      ["1", 5, "Madalena"],
      ["1", 6, "Hot Love & the Lazy Poet"],
      ["1", 7, "Seekers on the Ridge, Pt. 1 → Pt. 2"],
      ["1", 9, "(again) → Good Times // End Times → ((nocturne))"],
      ["1", 12, "Hot Tea"],
      ["2", 1, "Dripfield → Good2B"],
      ["2", 3, "Burn the Witch"],
      ["2", 4, "Tumble → Can't Get You Out of My Head → Tumble"],
      ["E1", 1, "Give It Time"],
    ]),
  },
  {
    id: "2026-08-31",
    dateLabel: "08.31.26",
    venue: "The Mishawaka",
    location: "Bellvue, CO",
    songs: songs("2026-08-31", [
      ["1", 1, "Iguana Song"],
      ["1", 2, "Me and My Uncle"],
      ["1", 3, "Caution"],
      ["1", 4, "Jeff Engborg"],
      ["1", 5, "Not Alone"],
      ["1", 6, "Turned Clouds"],
      ["1", 7, "Indian River → Interlude II"],
      ["1", 9, "Jive I → Jive II → Jive Lee"],
      ["2", 1, "Drive → Hollywood Nights"],
      ["2", 3, "Into the Myst"],
      ["2", 4, "Rosewood Heart"],
      ["2", 5, "The Labyrinth"],
      ["2", 6, "White Lights → Into the Myst"],
      ["E1", 1, "Trouble"],
    ]),
  },
  {
    id: "2026-09-01",
    dateLabel: "09.01.26",
    venue: "Red Rocks Park and Amphitheatre",
    location: "Morrison, CO",
    songs: songs("2026-09-01", [
      ["1", 1, "Royal"],
      ["1", 2, "Yeti"],
      ["1", 3, "Borne → Savenger → (you are here) → ((savengersspell))"],
      ["1", 7, "Peach"],
      ["1", 8, "Jed Stone"],
      ["1", 9, "Arrow → Undecided → Arrow"],
      ["2", 1, "Big Modern!"],
      ["2", 2, "(((postplace))) → So Ready → (s∆tellite)"],
      ["2", 5, "Arise"],
      ["2", 6, "Factory Fiction"],
    ]),
  },
  {
    id: "2026-09-02",
    dateLabel: "09.02.26",
    venue: "Dillon Amphitheater",
    location: "Dillon, CO",
    songs: songs("2026-09-02", [
      ["1", 1, "Echo of a Rose"],
      ["1", 2, "Atlas → Atlas Dogs"],
      ["1", 4, "Butter Rum"],
      ["1", 5, "A Western Sun → Look Out Cleveland → Dustin Hoffman"],
      ["2", 1, "Creatures"],
      ["2", 2, "Slow Ready"],
      ["2", 3, "This Old Sea"],
      ["2", 4, "Arcadia"],
      ["E1", 1, "Shama Lama Ding Dong → Danger Zone"],
    ]),
  },
]

export const VOTE_PICK_LIMIT = 10

const songById = new Map(
  COLORADO_RUN_SHOWS.flatMap((show) =>
    show.songs.map((song) => [song.id, { song, show }] as const),
  ),
)

export function getVoteSong(id: string) {
  return songById.get(id) ?? null
}

const songIdByName = new Map(
  COLORADO_RUN_SHOWS.flatMap((show) =>
    show.songs.map((song) => [song.name, song.id] as const),
  ),
)

export function getVoteSongIdByName(name: string) {
  return songIdByName.get(name) ?? null
}
