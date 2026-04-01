export type ArchiveEntry = {
  title: string
  description: string
  href: string
  icon: string
}

export const ARCHIVE_INTRO = {
  title: "WTED Archives",
  description:
    "The ultimate show history archive for Goose. Browse years, tours, songs, stats, personnel, venues, and more—all in one place.",
}

export const ARCHIVE_ENTRIES: ArchiveEntry[] = [
  {
    title: "Years",
    href: "/archive/years",
    icon: "Calendar",
    description:
      "Browse shows by year. Jump to any year from 2012 onward to see every show, setlist, and tour from that season.",
  },
  {
    title: "Tours",
    href: "/archive/tours",
    icon: "MapPin",
    description:
      "Explore tours and tour dates. View setlists, song matrices, guest appearances, and liberated songs for each tour.",
  },
  {
    title: "Songs",
    href: "/archive/songs",
    icon: "Music",
    description:
      "Search the full song catalog. Find performance history, last-played dates, and stats for every song in the Goose repertoire.",
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
      "Guest performers and collaborators. See who has sat in with Goose and explore their performance history across shows.",
  },
  {
    title: "Venues",
    href: "/archive/venues",
    icon: "MapPin",
    description:
      "Browse shows by venue. Find every Goose performance at your favorite spots, with maps and location details.",
  },
  {
    title: "Discography",
    href: "/archive/discography",
    icon: "Disc3",
    description:
      "Official releases and recordings. Studio albums, live releases, and archival recordings from the Goose catalog.",
  },
  {
    title: "Lists",
    href: "/archive/lists",
    icon: "ListMusic",
    description:
      "Curated song and show lists. Jive Suite, Dripfield, category lists, and community-created collections.",
  },
  {
    title: "Setlist Game",
    href: "/archive/setlistgame",
    icon: "Trophy",
    description:
      "Predict the setlist before the show. Pick songs, compete with friends, and see how you stack up when the band hits the stage.",
  },
  {
    title: "My Stats",
    href: "/archive/profile/overview",
    icon: "UserCircle",
    description:
      "Your personal archive stats. Track shows attended, songs seen, and your own Goose journey—sign in to view and share.",
  },
]
