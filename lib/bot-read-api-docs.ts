export const BOT_READ_API_VERSION = "1.0.0"

export type ApiDocsField = {
  name: string
  type: string
  description: string
}

export type ApiDocsParam = {
  name: string
  required: boolean
  type: string
  description: string
}

export type ApiDocsError = {
  status: number
  message: string
}

export type ApiDocsEndpoint = {
  id: string
  title: string
  summary: string
  query: string
  params: ApiDocsParam[]
  responseFields: ApiDocsField[]
  notes?: string[]
  exampleResponse: string
  exampleCurl: (baseUrl: string) => string
  errors: ApiDocsError[]
}

export const BOT_READ_API_NAV = [
  { id: "overview", label: "Overview", endpoint: false },
  { id: "authentication", label: "Authentication", endpoint: false },
  { id: "responses", label: "Responses", endpoint: false },
  { id: "workflow", label: "Request flow", endpoint: false },
  { id: "tours", label: "Tours", endpoint: true },
  { id: "shows", label: "Shows", endpoint: true },
  { id: "setlist", label: "Setlist", endpoint: true },
  { id: "songs", label: "Songs", endpoint: true },
  { id: "notes", label: "Notes", endpoint: false },
] as const

export const BOT_READ_API_ENDPOINTS: ApiDocsEndpoint[] = [
  {
    id: "tours",
    title: "List tours",
    summary: "Returns every tour in canon order.",
    query: "?endpoint=tours",
    params: [
      {
        name: "endpoint",
        required: true,
        type: "string",
        description: 'Must be "tours".',
      },
    ],
    responseFields: [
      { name: "tour", type: "string", description: 'Tour name, e.g. "2024 Fall".' },
      {
        name: "tour_canonid",
        type: "number",
        description: "Canon sort order (ascending).",
      },
      {
        name: "tour_id",
        type: "string (UUID)",
        description: "Tour identifier — pass to the Shows endpoint.",
      },
    ],
    notes: ["Sorted ascending by tour_canonid."],
    exampleResponse: `{
  "data": [
    {
      "tour": "2024 Fall",
      "tour_canonid": 42,
      "tour_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
  ],
  "meta": { "count": 1 }
}`,
    exampleCurl: (baseUrl) =>
      `curl -s -H "X-API-Key: YOUR_KEY" \\\n  "${baseUrl}?endpoint=tours"`,
    errors: [],
  },
  {
    id: "shows",
    title: "List shows on a tour",
    summary: "Returns shows for the tour identified by tour_id.",
    query: "?endpoint=shows&tour_id={uuid}",
    params: [
      {
        name: "endpoint",
        required: true,
        type: "string",
        description: 'Must be "shows".',
      },
      {
        name: "tour_id",
        required: true,
        type: "string (UUID)",
        description: "Tour UUID from the Tours endpoint.",
      },
    ],
    responseFields: [
      { name: "show_date", type: "string", description: "ISO date (YYYY-MM-DD)." },
      {
        name: "show_id",
        type: "string (UUID)",
        description: "Show identifier — pass to the Setlist endpoint.",
      },
      { name: "show_group", type: "string", description: 'e.g. "Goose".' },
      { name: "show_tour", type: "string", description: "Tour name." },
      { name: "show_subvenue", type: "string", description: "Venue name." },
      {
        name: "show_canonid",
        type: "number | null",
        description: "Canon show number, or null.",
      },
      { name: "show_venue_location", type: "string", description: "City / region." },
    ],
    notes: [
      "Shows whose detail contains “Recording Session” are excluded (same rule as the archive Years/Tours pages).",
      "Sort: rows with show_canonid first, then ascending show_canonid, show_date, show_group.",
    ],
    exampleResponse: `{
  "data": [
    {
      "show_date": "2024-10-18",
      "show_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "show_group": "Goose",
      "show_tour": "2024 Fall",
      "show_subvenue": "The Anthem",
      "show_canonid": 512,
      "show_venue_location": "Washington, DC"
    }
  ],
  "meta": { "count": 1 }
}`,
    exampleCurl: (baseUrl) =>
      `curl -s -H "X-API-Key: YOUR_KEY" \\\n  "${baseUrl}?endpoint=shows&tour_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890"`,
    errors: [
      { status: 400, message: "Missing required parameter: tour_id" },
      { status: 400, message: "Invalid tour_id" },
      { status: 404, message: "Tour not found" },
    ],
  },
  {
    id: "setlist",
    title: "List setlist entries",
    summary: "Returns setlist rows for a single show.",
    query: "?endpoint=setlist&show_id={uuid}",
    params: [
      {
        name: "endpoint",
        required: true,
        type: "string",
        description: 'Must be "setlist".',
      },
      {
        name: "show_id",
        required: true,
        type: "string (UUID)",
        description: "Show UUID from the Shows endpoint.",
      },
    ],
    responseFields: [
      { name: "entry_id", type: "string (UUID)", description: "Setlist row id." },
      {
        name: "entry_set",
        type: "string",
        description: 'Set key: "1", "2", … or "E1", "E2", …',
      },
      { name: "entry_setnum", type: "number", description: "Position within the set." },
      { name: "entry_song", type: "string", description: "Canonical song name." },
      {
        name: "entry_placement",
        type: "string | null",
        description: 'e.g. "Set 1 Opener".',
      },
      {
        name: "last_count",
        type: "number | null",
        description: "Normalized last-played count (see notes).",
      },
    ],
    notes: [
      "last_count: leading number from values like \"9, TD\" or \"28\"; \"Debut\" → 0; null/empty → null.",
      "Sort: main sets numerically, then encores (E1, E2, …), then entry_setnum within each set.",
    ],
    exampleResponse: `{
  "data": [
    {
      "entry_id": "d4e5f6a7-b8c9-0123-def0-234567890123",
      "entry_set": "1",
      "entry_setnum": 1,
      "entry_song": "Arcadia",
      "entry_placement": "Set 1 Opener",
      "last_count": 9
    }
  ],
  "meta": { "count": 1 }
}`,
    exampleCurl: (baseUrl) =>
      `curl -s -H "X-API-Key: YOUR_KEY" \\\n  "${baseUrl}?endpoint=setlist&show_id=c3d4e5f6-a7b8-9012-cdef-123456789012"`,
    errors: [
      { status: 400, message: "Missing required parameter: show_id" },
      { status: 400, message: "Invalid show_id" },
      { status: 404, message: "Show not found" },
    ],
  },
  {
    id: "songs",
    title: "List songs",
    summary:
      "Returns songs from the archive (same inclusion rules as the setlist game picking modal).",
    query: "?endpoint=songs",
    params: [
      {
        name: "endpoint",
        required: true,
        type: "string",
        description: 'Must be "songs".',
      },
    ],
    responseFields: [
      { name: "song", type: "string", description: "Canonical song name." },
      { name: "song_category", type: "string | null", description: "Category label." },
      { name: "song_id", type: "string (UUID)", description: "Song identifier." },
    ],
    notes: [
      "Included when category type is Goose, Goose Misc, Ted Tapes, or Cover Songs.",
      "Excluded when setlistgame_omit is true or song_placeholder is true.",
      "Sorted A–Z by song name.",
    ],
    exampleResponse: `{
  "data": [
    {
      "song": "Arcadia",
      "song_category": "Original",
      "song_id": "a7b8c9d0-e1f2-3456-7890-abcdef123456"
    }
  ],
  "meta": { "count": 1 }
}`,
    exampleCurl: (baseUrl) =>
      `curl -s -H "X-API-Key: YOUR_KEY" \\\n  "${baseUrl}?endpoint=songs"`,
    errors: [],
  },
]
