export type ArchiveEntry = {
  title: string
  description: string
  href: string
  icon: string
}

export const ARCHIVE_INTRO = {
  title: "WTED Archives",
  description:
    "",
}

export const ARCHIVE_ENTRIES: ArchiveEntry[] = [
  {
    title: "Years",
    href: "/old/archive/years",
    icon: "Calendar",
    description:
      "Browse shows by year. Jump to any year to see every show, setlist, and tour from that season.",
  },
  {
    title: "Tours",
    href: "/old/archive/tours",
    icon: "LineSegments",
    description:
      "View setlists, song matrices, guest appearances, notable performances, and liberated songs for each tour.",
  },
  {
    title: "Songs",
    href: "/archive/songs",
    icon: "Music",
    description:
      "Find performance history, last-played dates, and stats for every song in the Goose ecosphere.",
  },
  {
    title: "Stats",
    href: "/archive/stats",
    icon: "BarChart3",
    description:
      "Dive into the numbers. Longest songs, liberated songs, show stats, and more—filterable by year or all-time.",
  },
  {
    title: "Personnel",
    href: "/archive/personnel",
    icon: "Users",
    description:
      "Band members, guest performers, and collaborators. Explore their performance history across shows.",
  },
  {
    title: "Venues",
    href: "/old/archive/venues",
    icon: "MapPin",
    description:
      "Browse shows by venue. Find every performance at your favorite spots, with maps and location details.",
  },
  {
    title: "Discography",
    href: "/old/archive/discography",
    icon: "Disc3",
    description:
      "Official releases and recordings. Studio albums, live releases, and archival recordings from the Goose catalog.",
  },
  {
    title: "Lists",
    href: "/old/archive/lists",
    icon: "ListMusic",
    description:
      "Curated song and show lists. Longest shows, song suites, segues, and other community-created collections.",
  },
  {
    title: "Setlist Game",
    href: "/old/archive/setlistgame",
    icon: "Trophy",
    description:
      "Predict the setlist before the show. See how you stack up when the band hits the stage.",
  },
  {
    title: "Goose 101",
    href: "/goose101",
    icon: "BookOpen",
    description:
      "A chronological guide to Goose, featuring audio and video links to various releases and performances.",
  },
  {
    title: "Submit",
    href: "/archive/submit",
    icon: "PencilSimple",
    description:
      "Send setlist fixes, missing shows, and other archive contributions so the WTED hub stays sharp for everyone.",
  },
  {
    title: "My Stats",
    href: "/old/archive/profile/overview",
    icon: "UserCircle",
    description:
      "Your personal archive stats. Track shows attended, songs seen, and your own Goose journey.",
  },
]
