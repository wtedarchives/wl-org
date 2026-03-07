import { NextRequest, NextResponse } from "next/server"

const BANDCAMP_ALBUM_ID_REGEX = /<!-- album id (\d+) -->/

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid url parameter" },
      { status: 400 }
    )
  }

  const bandcampUrl = url.trim()
  if (
    !bandcampUrl.startsWith("https://") ||
    !bandcampUrl.includes("bandcamp.com")
  ) {
    return NextResponse.json(
      { error: "Invalid Bandcamp URL" },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(bandcampUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WysteriaLane/1.0; +https://wysterialane.org)",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Bandcamp returned ${response.status}` },
        { status: 502 }
      )
    }

    const html = await response.text()
    const match = html.match(BANDCAMP_ALBUM_ID_REGEX)
    const albumId = match ? match[1] : null

    if (!albumId) {
      return NextResponse.json(
        { error: "Could not find album ID in Bandcamp page" },
        { status: 404 }
      )
    }

    return NextResponse.json({ albumId })
  } catch (err) {
    console.error("Bandcamp album ID fetch error:", err)
    return NextResponse.json(
      { error: "Failed to fetch Bandcamp page" },
      { status: 500 }
    )
  }
}
