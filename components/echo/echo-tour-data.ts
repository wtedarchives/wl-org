export type EchoShowStatus = "Scored" | "Live" | "Open" | "Closed"

export type EchoHubLayout = "countdown" | "timeline"

export type EchoNavId = "tour" | "show" | "tours" | "profile"

export type EchoShowRow = {
  dateShort: string
  dateLong: string
  weekday: string
  venue: string
  city: string
  detail: string
  status: EchoShowStatus
  players: number
  myScore: string
}

export type EchoStandingRow = {
  rank: number
  name: string
  points: number
  isMe: boolean
}

export const ECHO_TOUR_TITLE = "2026 Summer"
export const ECHO_TOUR_LEG = "[Second Leg]"
export const ECHO_TOUR_SUMMARY = "14 shows · 2 scored · 238 players this leg"

export const ECHO_NEXT_SHOW = {
  dateLong: "Fri, Aug 21",
  venue: "Thompson's Point",
  city: "Portland, ME",
  countdown: "2d 14h 06m",
  players: 96,
}

export const ECHO_LIVE_NOW_LINE =
  "The Salt Shed setlist is being entered, song 7 of 12."

export const ECHO_YOU_THIS_TOUR = {
  rankLabel: "2nd",
  ofPlayers: "of 238",
  pointsLine: "55 points across 2 scored shows",
}

export const ECHO_TOP_TEN: EchoStandingRow[] = [
  { rank: 1, name: "jiveleelow", points: 68, isMe: false },
  { rank: 2, name: "echo_ellie", points: 55, isMe: true },
  { rank: 3, name: "hungersite", points: 52, isMe: false },
  { rank: 4, name: "thatch_er", points: 49, isMe: false },
  { rank: 5, name: "vasudo_vic", points: 46, isMe: false },
  { rank: 6, name: "arrow_aria", points: 43, isMe: false },
  { rank: 7, name: "emg_ed", points: 40, isMe: false },
  { rank: 8, name: "tumbleweed", points: 37, isMe: false },
  { rank: 9, name: "pancake", points: 34, isMe: false },
  { rank: 10, name: "slow_ready", points: 31, isMe: false },
]

export const ECHO_SHOWS: EchoShowRow[] = [
  {
    dateShort: "08.14",
    dateLong: "Aug 14",
    weekday: "Friday",
    venue: "Red Rocks Amphitheatre",
    city: "Morrison, CO",
    detail: "Night 1",
    status: "Scored",
    players: 247,
    myScore: "31",
  },
  {
    dateShort: "08.15",
    dateLong: "Aug 15",
    weekday: "Saturday",
    venue: "Red Rocks Amphitheatre",
    city: "Morrison, CO",
    detail: "Night 2",
    status: "Scored",
    players: 241,
    myScore: "24",
  },
  {
    dateShort: "08.18",
    dateLong: "Aug 18",
    weekday: "Tuesday",
    venue: "The Salt Shed",
    city: "Chicago, IL",
    detail: "",
    status: "Live",
    players: 238,
    myScore: "—",
  },
  {
    dateShort: "08.21",
    dateLong: "Aug 21",
    weekday: "Friday",
    venue: "Thompson's Point",
    city: "Portland, ME",
    detail: "",
    status: "Open",
    players: 96,
    myScore: "—",
  },
  {
    dateShort: "08.22",
    dateLong: "Aug 22",
    weekday: "Saturday",
    venue: "Bank of NH Pavilion",
    city: "Gilford, NH",
    detail: "",
    status: "Open",
    players: 54,
    myScore: "—",
  },
  {
    dateShort: "08.28",
    dateLong: "Aug 28",
    weekday: "Friday",
    venue: "Forest Hills Stadium",
    city: "Queens, NY",
    detail: "Tour close",
    status: "Open",
    players: 22,
    myScore: "—",
  },
]
