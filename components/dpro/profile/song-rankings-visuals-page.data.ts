import type { VisualRankingEntry } from "@/components/dpro/profile/song-rankings-visuals-rankings-grid"
import type { VisualRankingSong } from "@/components/dpro/profile/song-rankings-visuals-vote-cards"

export const SONG_RANKINGS_VISUALS_ART = {
  dripfield: "/badge-dripfield.png",
  emg: "/badge-everything.png",
  mooncabin: "/badge-mooncabin.png",
  greatblue: "/badge-greatblue.png",
  shenanigans: "/badge-shenanigans.png",
  orebolo: "/badge-orebolo.png",
  nightlights: "/badge-nightlights.png",
  vasudo: "/badge-vasudo.png",
  chain: "/badge-chain.png",
  autumn: "/badge-autumn.png",
  undecided: "/badge-undecided.png",
} as const

const PLACEHOLDER_SONG_A: VisualRankingSong = {
  song_id: "00000000-0000-4000-8000-000000000001",
  song: "Dripless",
  categoryArtwork: SONG_RANKINGS_VISUALS_ART.dripfield,
}

const PLACEHOLDER_SONG_B: VisualRankingSong = {
  song_id: "00000000-0000-4000-8000-000000000002",
  song: "Arcadia",
  categoryArtwork: SONG_RANKINGS_VISUALS_ART.emg,
}

export const SONG_RANKINGS_VISUALS_PLACEHOLDER_SONG_A = PLACEHOLDER_SONG_A
export const SONG_RANKINGS_VISUALS_PLACEHOLDER_SONG_B = PLACEHOLDER_SONG_B

export const SONG_RANKINGS_VISUALS_PLACEHOLDER_RANKS: VisualRankingEntry[] = [
  { rank: 1, ...PLACEHOLDER_SONG_A },
  {
    rank: 2,
    song_id: "00000000-0000-4000-8000-000000000003",
    song: "Thatch",
    categoryArtwork: SONG_RANKINGS_VISUALS_ART.mooncabin,
  },
  {
    rank: 3,
    song_id: "00000000-0000-4000-8000-000000000004",
    song: "Hungersite",
    categoryArtwork: SONG_RANKINGS_VISUALS_ART.greatblue,
  },
  {
    rank: 4,
    song_id: "00000000-0000-4000-8000-000000000005",
    song: "Flodown",
    categoryArtwork: SONG_RANKINGS_VISUALS_ART.shenanigans,
  },
  {
    rank: 5,
    song_id: "00000000-0000-4000-8000-000000000006",
    song: "So Ready",
    categoryArtwork: SONG_RANKINGS_VISUALS_ART.orebolo,
  },
  {
    rank: 6,
    song_id: "00000000-0000-4000-8000-000000000007",
    song: "Into the Myst",
    categoryArtwork: SONG_RANKINGS_VISUALS_ART.nightlights,
  },
  {
    rank: 7,
    song_id: "00000000-0000-4000-8000-000000000008",
    song: "Rockdale",
    categoryArtwork: SONG_RANKINGS_VISUALS_ART.vasudo,
  },
  {
    rank: 8,
    song_id: "00000000-0000-4000-8000-000000000009",
    song: "Hot Tea",
    categoryArtwork: SONG_RANKINGS_VISUALS_ART.chain,
  },
  {
    rank: 9,
    song_id: "00000000-0000-4000-8000-000000000010",
    song: "Turned Clouds",
    categoryArtwork: SONG_RANKINGS_VISUALS_ART.autumn,
  },
  {
    rank: 10,
    song_id: "00000000-0000-4000-8000-000000000011",
    song: "Your Direction",
    categoryArtwork: SONG_RANKINGS_VISUALS_ART.undecided,
  },
  { rank: 11, ...PLACEHOLDER_SONG_B },
  {
    rank: 12,
    song_id: "00000000-0000-4000-8000-000000000012",
    song: "Madhuvan",
    categoryArtwork: SONG_RANKINGS_VISUALS_ART.mooncabin,
  },
]

export const SONG_RANKINGS_VISUALS_PLACEHOLDER_UNRANKED: VisualRankingSong[] = [
  {
    song_id: "00000000-0000-4000-8000-000000000020",
    song: "Echo of a Rose",
    categoryArtwork: SONG_RANKINGS_VISUALS_ART.emg,
  },
  {
    song_id: "00000000-0000-4000-8000-000000000021",
    song: "Bullet",
    categoryArtwork: SONG_RANKINGS_VISUALS_ART.dripfield,
  },
]
