import type { ReactNode } from "react"

export type NavMainItem = {
  title: string
  url: string
  icon: ReactNode
}

/** Optional top-level sidebar links below Publications (e.g. standalone pages). */
export const navMainItems: readonly NavMainItem[] = []

export const WTED_RADIO_SUB = [
  { title: "Shows", url: "/radio/episodes" },
  { title: "About Us and FAQ", url: "/radio/about" },
  { title: "Help", url: "/help" },
  { title: "GORPs and Contributors", url: "/radio/gorps" },
] as const

export const SETLIST_ARCHIVE_SUB = [
  { title: "Tours", url: "/archive/tours" },
  { title: "Songs", url: "/archive/songs" },
  { title: "Stats", url: "/archive/stats" },
  { title: "Personnel", url: "/archive/personnel" },
  { title: "Venues", url: "/archive/venues" },
  { title: "Discography", url: "/archive/discography" },
  { title: "Lists", url: "/archive/lists" },
  { title: "Echo of a Show", url: "/archive/echo" },
  { title: "Submit", url: "/archive/submit" },
] as const

/** Hardcoded years for nav; year_id must match Supabase years table (year, year_id). */
export const NAV_YEARS = [
  { year: "2012", year_id: "d0a3d0b0-a40f-40f1-9430-712e616ab844" },
  { year: "2013", year_id: "51dc603b-2b18-4c97-8573-1f0c99eae9f1" },
  { year: "2014", year_id: "08778200-4ae7-48f9-b6dc-275842f0a56d" },
  { year: "2015", year_id: "794bb9d6-6483-4cd0-9174-04fa872b4bb0" },
  { year: "2016", year_id: "96b02a0e-1d4d-4baa-9b2e-a8d445ead63b" },
  { year: "2017", year_id: "23989762-c3df-4631-821b-0fb01ee44020" },
  { year: "2018", year_id: "6da8e2f8-14d9-458d-a4ad-7793de2ad94f" },
  { year: "2019", year_id: "d71b7545-574d-4801-808b-fb704e0e80fa" },
  { year: "2020", year_id: "6acf970b-97d4-4d19-a90a-28149e37327c" },
  { year: "2021", year_id: "0e646c0e-3630-413a-b7d5-d52dba1947fe" },
  { year: "2022", year_id: "9f380c88-e925-47c5-a5b0-ac8c18d2be6b" },
  { year: "2023", year_id: "ced3076c-8659-42ce-a2cd-6ca3a871ce10" },
  { year: "2024", year_id: "20765f62-5610-4d2d-b03a-8ddb307577f7" },
  { year: "2025", year_id: "6b13c0c8-3fdc-41bd-996b-f598bd18696e" },
  { year: "2026", year_id: "4ca4a7dd-19c5-45af-ab9b-6f7e20f4b445" },
  { year: "2027", year_id: "c958893a-3d94-4824-be60-79036afe82b1" },
] as const

export type FollowUsNetwork =
  | "bluesky"
  | "instagram"
  | "facebook"
  | "x"

export type FollowUsLinkItem = {
  label: string
  href: string
  network: FollowUsNetwork
}

export type FollowUsGroup = {
  id: string
  title: string
  brandSrc: string
  links: readonly FollowUsLinkItem[]
  /** When set, overrides default platform sort for this group’s links. */
  platformOrder?: readonly FollowUsNetwork[]
}

/** Social links for sidebar "Follow Us" mega-menu (grouped by brand). */
export const FOLLOW_US_GROUPS = [
  {
    id: "radio",
    title: "WTED Radio",
    brandSrc: "/WTED2.png",
    links: [
      {
        label: "@WTEDRadio.com",
        href: "https://bsky.app/profile/wtedradio.com",
        network: "bluesky",
      },
      {
        label: "@WTEDRadio",
        href: "https://www.instagram.com/wtedradio/",
        network: "instagram",
      },
      {
        label: "WTED Goose Radio",
        href: "https://www.facebook.com/profile.php?id=100095630467139",
        network: "facebook",
      },
    ],
  },
  {
    id: "community",
    title: "Wysteria Lane Community",
    brandSrc: "/WL.png",
    links: [
      {
        label: "@WysteriaLane.org",
        href: "https://bsky.app/profile/wysterialane.org",
        network: "bluesky",
      },
    ],
  },
  {
    id: "archive",
    title: "WTED Archives",
    brandSrc: "/wted-sa-cropped-2.png",
    platformOrder: ["x", "bluesky", "instagram", "facebook"],
    links: [
      {
        label: "@WTEDArchives",
        href: "https://x.com/WTEDArchives",
        network: "x",
      },
      {
        label: "@WTEDArchives",
        href: "https://bsky.app/profile/WTEDArchives.bsky.social",
        network: "bluesky",
      },
    ],
  },
] satisfies readonly FollowUsGroup[]

export const LINKS = [
  { title: "Goose Website", href: "https://www.goosetheband.com/" },
  { title: "Western Sun Foundation", href: "https://westernsunfoundation.org/" },
  { title: "Conscious Alliance", href: "https://consciousalliance.org/" },
  { title: "ElGoose.Net", href: "https://elgoose.net/" },
  { title: "Cash or Trade", href: "https://cashortrade.org/" },
  { title: "Goose Bandcamp Page", href: "https://goosetheband.bandcamp.com/" },
] as const

export const MERCH_LINKS = [
  {
    title: "Jungle Room",
    href: "https://junglerooooom.com/collections/wted",
  },
  {
    title: "Tees That Jam",
    href: "https://www.teesthatjam.com/product/2025-wted-fund-raiser-%F0%9F%AA%BF/",
  },
] as const

export const MEDIA_LINKS = [
  {
    title: "El Goose Times",
    href: "https://www.elgoosetimes.com/",
  },
  {
    title: "Always Almost There Podcast",
    href: "https://aatgoosepod.com/",
  },
  {
    title: "The Femme Flock",
    href: "https://www.thefemmeflock.com/",
  },
  {
    title: "Slow Ready Podcast",
    href: "https://slowreadypod.buzzsprout.com/",
  },
] as const

export const COMMUNITY_FORUM_SUB = [
  {
    title: "GOOSE(c)",
    url: "https://community.wysterialane.org/chat/c/goosec/14",
    color: "#e04d2f",
  },
  {
    title: "Non-Goose",
    url: "https://community.wysterialane.org/chat/c/ngoosec/56",
    color: "#246151",
  },
  {
    title: "The Couch",
    url: "https://community.wysterialane.org/chat/c/the-couch/3",
    color: "#863523",
  },
] as const

export const ADMIN_SUB = [
  { title: "Admin Panel", url: "/archive/admin" },
  { title: "Radio", url: "/archive/admin/radio" },
  { title: "Bugs", url: "/archive/bugs" },
] as const
