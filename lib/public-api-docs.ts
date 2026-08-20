export const PUBLIC_API_VERSION = "1.0.0"

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

export type ApiDocsFieldGroup = {
  title: string
  description?: string
  fields: ApiDocsField[]
}

export type ApiDocsEndpoint = {
  id: string
  title: string
  summary: string
  path: string
  params: ApiDocsParam[]
  responseFields: ApiDocsField[]
  responseFieldGroups?: ApiDocsFieldGroup[]
  notes?: string[]
  exampleResponse: string
  exampleCurl: (baseUrl: string) => string
  errors: ApiDocsError[]
}

export const PUBLIC_API_NAV = [
  { id: "overview", label: "Overview", endpoint: false },
  { id: "authentication", label: "Authentication", endpoint: false },
  { id: "responses", label: "Responses", endpoint: false },
  { id: "discography", label: "Discography", endpoint: true },
  { id: "discography-entry", label: "Discography entry", endpoint: true },
  { id: "groups", label: "Groups", endpoint: true },
  { id: "personnel", label: "Personnel", endpoint: true },
  { id: "personnel-entry", label: "Personnel entry", endpoint: true },
  { id: "notes", label: "Notes", endpoint: false },
] as const

export const PUBLIC_API_ENDPOINTS: ApiDocsEndpoint[] = [
  {
    id: "discography",
    title: "List discography",
    summary: "Returns every discography release.",
    path: "/discography",
    params: [],
    responseFields: [
      {
        name: "id",
        type: "string (UUID)",
        description: "Release identifier — pass to Discography entry as id.",
      },
      { name: "artist", type: "string", description: "Release artist." },
      { name: "release", type: "string", description: "Public release title." },
      { name: "category", type: "string", description: "Release category." },
      {
        name: "release_date",
        type: "string",
        description: "ISO date (YYYY-MM-DD).",
      },
      {
        name: "notes",
        type: "string | null",
        description: "Notes for the release, if any.",
      },
    ],
    notes: [
      "Only these fields are returned. No other discography columns are included.",
    ],
    exampleResponse: `{
  "data": [
    {
      "id": "b48f7b76-c522-4dfb-b64e-eda8cc25f798",
      "artist": "Great Blue",
      "release": "Space",
      "category": "Side Projects",
      "release_date": "2012-07-06",
      "notes": null
    }
  ],
  "meta": { "count": 1 }
}`,
    exampleCurl: (baseUrl) =>
      `curl -s -H "X-API-Key: YOUR_KEY" \\\n  "${baseUrl}/discography"`,
    errors: [],
  },
  {
    id: "discography-entry",
    title: "Get discography entry",
    summary:
      "Returns a single discography release identified by id, plus its linked setlist tracks.",
    path: "/discography-entry?id={uuid}",
    params: [
      {
        name: "id",
        required: true,
        type: "string (UUID)",
        description: "Matches discography.uuid.",
      },
    ],
    responseFields: [
      {
        name: "id",
        type: "string (UUID)",
        description: "Release identifier.",
      },
      { name: "artist", type: "string", description: "Release artist." },
      { name: "release", type: "string", description: "Public release title." },
      { name: "category", type: "string", description: "Release category." },
      {
        name: "release_date",
        type: "string",
        description: "ISO date (YYYY-MM-DD).",
      },
      {
        name: "notes",
        type: "string | null",
        description: "Notes on the matching discography row, if any.",
      },
      {
        name: "tracks",
        type: "array",
        description:
          "Linked tracks for this id, sorted by discography_entries.order.",
      },
    ],
    responseFieldGroups: [
      {
        title: "tracks[]",
        description:
          "Each item is a discography_entries row whose discography_entry matches the release id. Track fields come from setlist_entries (via setlist_entry → entry_id). Show fields come from shows (via entry_show → show_id).",
        fields: [
          { name: "song", type: "string", description: "Song name." },
          {
            name: "short",
            type: "string | null",
            description: "Short title, if any.",
          },
          {
            name: "segue",
            type: "string | null",
            description: "Segue marker, if any.",
          },
          {
            name: "length",
            type: "string | null",
            description: "Track length (HH:MM:SS).",
          },
          {
            name: "set_placement",
            type: "string | null",
            description: "Set placement, if any.",
          },
          {
            name: "notes",
            type: "string | null",
            description: "Notes on the setlist row, if any.",
          },
          {
            name: "show_date",
            type: "string",
            description: "ISO date (YYYY-MM-DD) of the source show.",
          },
          { name: "show_group", type: "string", description: "Performing group." },
          { name: "show_venue", type: "string", description: "Venue name." },
          {
            name: "show_location",
            type: "string",
            description: "City / region.",
          },
        ],
      },
    ],
    notes: [
      "tracks is sorted by discography_entries.order. The order value itself is not returned.",
      "Only the documented fields are returned. No other discography, discography_entries, setlist_entries, or shows columns are included.",
    ],
    exampleResponse: `{
  "data": {
    "id": "a115f9c4-8aa8-4ffc-9860-1c2be54d0825",
    "artist": "Goose",
    "release": "Live at The Capitol Theatre – 2024.04.07-10 – Port Chester, NY",
    "category": "Live Albums",
    "release_date": "2024-05-31",
    "notes": null,
    "tracks": [
      {
        "song": "Flodown",
        "short": null,
        "segue": null,
        "length": "00:09:07",
        "set_placement": "Set 1 Opener",
        "notes": null,
        "show_date": "2024-04-07",
        "show_group": "Goose",
        "show_venue": "The Capitol Theatre",
        "show_location": "Port Chester, NY"
      },
      {
        "song": "Seekers on the Ridge, Pt. 1",
        "short": null,
        "segue": ">",
        "length": "00:06:18",
        "set_placement": "Main Set 1",
        "notes": null,
        "show_date": "2024-04-07",
        "show_group": "Goose",
        "show_venue": "The Capitol Theatre",
        "show_location": "Port Chester, NY"
      }
    ]
  },
  "meta": { "count": 1 }
}`,
    exampleCurl: (baseUrl) =>
      `curl -s -H "X-API-Key: YOUR_KEY" \\\n  "${baseUrl}/discography-entry?id=a115f9c4-8aa8-4ffc-9860-1c2be54d0825"`,
    errors: [
      { status: 400, message: "Missing required parameter: id" },
      { status: 400, message: "Invalid id" },
      { status: 404, message: "Discography not found" },
    ],
  },
  {
    id: "groups",
    title: "List groups",
    summary: "Returns every group.",
    path: "/groups",
    params: [],
    responseFields: [
      { name: "group", type: "string", description: "Group name." },
      {
        name: "id",
        type: "string (UUID)",
        description: "Group identifier.",
      },
    ],
    notes: [
      "Only these two fields are returned. No other groups columns are included.",
    ],
    exampleResponse: `{
  "data": [
    {
      "group": "Goose",
      "id": "5392e969-2986-48c0-ace2-0c8c786dea58"
    }
  ],
  "meta": { "count": 1 }
}`,
    exampleCurl: (baseUrl) =>
      `curl -s -H "X-API-Key: YOUR_KEY" \\\n  "${baseUrl}/groups"`,
    errors: [],
  },
  {
    id: "personnel",
    title: "List personnel",
    summary: "Returns every guest, sorted by guest_canonid.",
    path: "/personnel",
    params: [],
    responseFields: [
      {
        name: "category",
        type: "string",
        description: "Personnel category.",
      },
      {
        name: "instrument",
        type: "string",
        description: "Instrument(s).",
      },
      { name: "name", type: "string", description: "Personnel name." },
      {
        name: "id",
        type: "string (UUID)",
        description: "Personnel identifier — pass to Personnel entry as id.",
      },
    ],
    notes: [
      "Sorted by guests.guest_canonid. The canon id itself is not returned.",
      "Only these four fields are returned. No other guests columns are included.",
    ],
    exampleResponse: `{
  "data": [
    {
      "category": "Goose (current)",
      "instrument": "guitar, vocals, drums",
      "name": "Rick Mitarotonda",
      "id": "8542036e-0c8a-4671-86e1-8cff80eec9d3"
    }
  ],
  "meta": { "count": 1 }
}`,
    exampleCurl: (baseUrl) =>
      `curl -s -H "X-API-Key: YOUR_KEY" \\\n  "${baseUrl}/personnel"`,
    errors: [],
  },
  {
    id: "personnel-entry",
    title: "Get personnel entry",
    summary:
      "Returns a single guest identified by id, plus the shows they have appeared on.",
    path: "/personnel-entry?id={uuid}",
    params: [
      {
        name: "id",
        required: true,
        type: "string (UUID)",
        description: "Matches guests.guest_id.",
      },
    ],
    responseFields: [
      {
        name: "id",
        type: "string (UUID)",
        description: "Personnel identifier.",
      },
      {
        name: "category",
        type: "string",
        description: "Personnel category.",
      },
      {
        name: "instrument",
        type: "string",
        description: "Instrument(s).",
      },
      { name: "name", type: "string", description: "Personnel name." },
      {
        name: "shows",
        type: "array",
        description:
          "Distinct shows this guest appears on in setlist_entry_guests, sorted by show_group then show_date.",
      },
    ],
    responseFieldGroups: [
      {
        title: "shows[]",
        description:
          "Each item is a unique show linked through setlist_entry_guests (guest_id) → setlist_entries (entry_id) → shows (show_id). A guest listed on multiple songs at the same show appears once.",
        fields: [
          {
            name: "id",
            type: "string (UUID)",
            description: "Show identifier.",
          },
          {
            name: "date",
            type: "string",
            description: "ISO date (YYYY-MM-DD).",
          },
          {
            name: "group",
            type: "string",
            description: "Performing group.",
          },
        ],
      },
    ],
    notes: [
      "shows is sorted by show_group, then show_date. Duplicate shows are removed.",
      "Only the documented fields are returned. No other guests, setlist_entry_guests, setlist_entries, or shows columns are included.",
    ],
    exampleResponse: `{
  "data": {
    "id": "8fb0d25b-cf01-4205-8bf0-cff2f6c00f09",
    "category": "Guest",
    "instrument": "drums",
    "name": "Bill Kreutzmann",
    "shows": [
      {
        "id": "a32478a6-bff4-445f-a2d4-d30055060747",
        "date": "2023-01-16",
        "group": "Dead & Company"
      },
      {
        "id": "992cb682-5fdd-4791-a0a9-614a56231ff1",
        "date": "2023-01-17",
        "group": "Dead & Company"
      }
    ]
  },
  "meta": { "count": 1 }
}`,
    exampleCurl: (baseUrl) =>
      `curl -s -H "X-API-Key: YOUR_KEY" \\\n  "${baseUrl}/personnel-entry?id=8fb0d25b-cf01-4205-8bf0-cff2f6c00f09"`,
    errors: [
      { status: 400, message: "Missing required parameter: id" },
      { status: 400, message: "Invalid id" },
      { status: 404, message: "Personnel not found" },
    ],
  },
]
