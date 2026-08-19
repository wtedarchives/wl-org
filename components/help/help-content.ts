export type HelpFaqGroup = {
  title: string
  items: string[]
}

export type HelpFaqEntry = {
  id: string
  question: string
  /** YouTube video id (from youtu.be / watch?v=). */
  youtubeId: string
  paragraphs?: string[]
  groups?: HelpFaqGroup[]
}

export const HELP_INTRO = {
  title: "Help",
  body: "Guides and walkthroughs for using WTEDRadio.com — signing in, navigating the home page, WTED Goose Radio, and WTED Archives.",
} as const

export const HELP_FAQ_ENTRIES: HelpFaqEntry[] = [
  {
    id: "sign-in",
    question: "How do I sign in on WTEDRadio.com?",
    youtubeId: "OMWG0gSo06E",
    paragraphs: [
      "There are two ways to log in and access content on either WTED Radio or Wysteria Lane Community.",
      "On Wysteria Lane Community, click Log In and enter your credentials.",
      "On WTEDRadio.com, click on the white Profile icon in the top right, and click Sign In. You’ll then be redirected to Wysteria Lane Community. Enter your credentials, and then you’ll be redirected back to WTEDRadio.com.",
      "You’ll then have access to both sites and can navigate back-and-forth between them seamlessly.",
    ],
  },
  {
    id: "home-page",
    question: "How do I navigate the Home page of WTEDRadio.com?",
    youtubeId: "2zf6vA7YTaI",
    paragraphs: [
      "Across the top navigation bar you’ll find a live feed of WTED Goose Radio that you can play while you navigate through the site. You’ll also see buttons to Support WTED Radio, follow our various social media accounts, and high-level menus for WTED Radio, Wysteria Lane Community, and WTED Archives.",
      "In the main section of the home page, there are four cards to access each of the main areas of the site:",
    ],
    groups: [
      {
        title: "WTED Goose Radio",
        items: [
          "There’s a card displaying the upcoming schedule for WTED Radio, a button to request songs to be played during our requesTED show, and view profiles about our GORPs.",
        ],
      },
      {
        title: "Wysteria Lane Community",
        items: [
          "You’ll see a list of featured topics to engage with on the Community.",
        ],
      },
      {
        title: "WTED Archives",
        items: [
          "We have a card displaying the most recent Goose setlist, and buttons for the upcoming tour schedule, This Day in Goose History, playing our setlist game, and accessing a random show.",
        ],
      },
      {
        title: "My Show Stats",
        items: [
          "Your own profile with the ability to track shows you’ve attended. You’ll see the number of shows and songs, as well as your previous and next show.",
        ],
      },
    ],
  },
  {
    id: "request-song",
    question: "How do I request a song to be played on WTED Goose Radio?",
    youtubeId: "dcBgMXgDomY",
    paragraphs: [
      "There are two ways to request a song to be played on WTED Goose Radio.",
      "Please note that you must be signed in to your account in order to request songs. Users must wait 10 seconds between requests, and can only make four requests every 60 minutes.",
      "On the home page of WTEDRadio.com, click on Request a Song. Search for the track you’re looking for, and click the green check mark. Confirm your selection by clicking on Request Track.",
      "On an individual show’s page, if a song is request-able on WTED Goose Radio, you’ll see the WTED Radio logo next to it. Click on the logo, and click Request Track.",
    ],
  },
  {
    id: "episodes",
    question: "How do I know what is played on WTED Goose Radio?",
    youtubeId: "f43rG2TFY8E",
    paragraphs: [
      "Accessible via the home page and in the top navigation bar, you’ll navigate to the Episodes page. This page is a complete listing of every show and episode we play on WTED Radio, complete with full song listings for each episode. Song listings include links to setlists that the selected songs were pulled from.",
    ],
  },
  {
    id: "archives-overview",
    question: "An overview of the pages within WTED Archives.",
    youtubeId: "YdRgbT_wn0w",
    groups: [
      {
        title: "Homepage",
        items: [
          "Most recent Goose show and setlist, current touring schedule, Today in Goose History, random show button, shortcut to setlist game.",
        ],
      },
      {
        title: "Years",
        items: [
          "Lists all Goose and side projects show dates within the selected year, average setlist of all Goose shows within the year, filter by tour and group.",
        ],
      },
      {
        title: "Tours",
        items: [
          "Lists all Goose shows within the selected tour (defaults to the current tour), power slots table, song spread, longest songs, top returning songs, song listing/matrix, average setlist of all shows within the tour, most common songs not played on the tour, guest appearances.",
        ],
      },
      {
        title: "Songs",
        items: [
          "Complete listing of songs performed by Goose and all side projects. Searchable by song name and category. Links to individual song pages with full performance listings.",
        ],
      },
      {
        title: "Stats",
        items: [
          "Charts for top played songs, power slots, song spread, longest shows, rarest setlists and more, broken out by year or all-time.",
        ],
      },
      {
        title: "Personnel",
        items: [
          "Complete listing of all band members (current and former) and guests. Links to individual pages with full performance listings with filters.",
        ],
      },
      {
        title: "Venues",
        items: [
          "Complete listing of all venues Goose and all side projects have performed at. Interactive map with tour mappings. Links to individual pages with full performance listings.",
        ],
      },
      {
        title: "Discography",
        items: [
          "Complete listing of all physical media released by Goose and side projects. Links to individual pages with full song listings and visual media associated with the release.",
        ],
      },
      {
        title: "Lists",
        items: [
          "Uncommon stats from Goose shows, sorted into handy lists. Jivefectas, Dripfield suites, full album performances, longest shows, and more.",
        ],
      },
      {
        title: "Echo of a Show",
        items: [
          "Call the songs before Goose plays them. Points for the song, more for the right set, most for the exact spot.",
        ],
      },
      {
        title: "Goose 101",
        items: [
          "A complete history of the band from conception to today!",
        ],
      },
      {
        title: "Submit",
        items: [
          "Got something we’re missing? Fill out the form and we’ll get it added.",
        ],
      },
    ],
  },
  {
    id: "log-shows",
    question: "How do I log shows I've attended in WTED Archives?",
    youtubeId: "mpBFEJ-f_to",
    paragraphs: [
      "There are two ways to log shows you’ve attended:",
      "When viewing a particular show’s page, click the orange “I Was There” button in the column on the right side of the page.",
      "When viewing My Show Stats, go to the Shows tab, click on Manage Shows, and search for shows you’ve attended. Click the check mark on the left side of the table for each show you want to add. Scroll up and click “Back to Shows” to see your refreshed stats.",
    ],
  },
  {
    id: "setlist-columns",
    question: "What exactly is all of this data on a particular setlist page?",
    youtubeId: "Az1tWk_91u0",
    groups: [
      {
        title: "Song column",
        items: [
          "Green boxes indicate intros for a particular song [i.e. (begin) for Big Modern!, … for Dr. Darkness, etc.]",
          "Red boxes indicate partials/unfinished notes for songs",
          "Red arrows indicate a song segueing into the next song",
          "Colored badges indicate how far a performance went in the JOTY bracket for that year",
          "Yellow plus signs indicate a song contained a parenthetical jam (dawn, satellite, savengerspell, etc.).",
        ],
      },
      {
        title: "WTED column",
        items: [
          "If a song has a WTED icon present, the song can be requested on WTED Radio by clicking on the icon.",
        ],
      },
      {
        title: "Time column",
        items: [
          "The length of the song’s performance at that show.",
        ],
      },
      {
        title: "Last column",
        items: [
          "The number indicates how many shows its been since the song’s last performance.",
          "TD means it was the tour debut performance of the song and is denoted in green.",
          "LIB means the song returned from more than a calendar year away from setlists, and is denoted in yellow.",
          "Debut means it was the debut performance of the song by Goose.",
        ],
      },
      {
        title: "Tour column",
        items: [
          "X of Y indicates the shows chronological performance within the tour (X) and the total number of performances in the tour (Y).",
        ],
      },
      {
        title: "Rarity column",
        items: [
          "Calculates the total number of performances of the song divided by the total number of shows since the song’s debut by Goose (calculated at the current show’s point in time).",
        ],
      },
      {
        title: "Media column",
        items: [
          "If a song has a Bandcamp track or YouTube video, an icon will appear, and will display said content when clicked on.",
        ],
      },
      {
        title: "Personnel column",
        items: [
          "All band members and guests who played on the song are listed here. Light green indicates a current band member, dark green indicates a former band member, and red indicates a guest.",
        ],
      },
      {
        title: "Coach’s Notes column",
        items: [
          "Any other noteworthy tidbits about the performance will be noted here.",
        ],
      },
    ],
  },
]
