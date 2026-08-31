/**
 * Renders the WTED Radio schedule share card as JPEG.
 *
 * Why it exists: the browser export it replaces rasterised the DOM with
 * `html-to-image`, which goes through an SVG `foreignObject` — and every
 * `foreignObject` path rasterises BLANK on mobile WebKit. That is the same
 * failure that moved the setlist share card server-side (see
 * `setlist-share-image.mts`); this is the schedule card taking the same route,
 * so `/radio/scheduleimg` works on a phone.
 *
 * Like the setlist renderer this runs on Netlify rather than Supabase Edge:
 * Supabase caps a request at ~2s of CPU, and a 1080x1919 story frame is 2.1M
 * pixels — several times what that cap allows.
 *
 * Unlike the setlist renderer it is NOT purely a rasteriser: row artwork lives
 * on third-party hosts, and fetching it here (rather than having the browser
 * inline it first) is both faster and the whole point — a phone that cannot
 * rasterise the card should not have to prepare its images either. Fetches are
 * held to the same allowlist as `schedule-share-image-proxy`.
 *
 * There is no database access, so no Supabase credentials live on Netlify. The
 * caller is a signed-in browser, so the gate is the site's own session JWT
 * rather than the shared secret the setlist renderer uses.
 */
import { createHmac, timingSafeEqual } from "node:crypto"
import satori from "satori"
import { Resvg } from "@resvg/resvg-js"
import jpeg from "jpeg-js"
import {
  pickScheduleBackgroundStem,
  scheduleCardAssets,
} from "../../supabase/functions/_shared/schedule-share-card/assets.ts"
import {
  buildScheduleShareCard,
  SCHEDULE_CARD_HEIGHT_PX,
  SCHEDULE_CARD_WIDTH_PX,
  type ScheduleCardRow,
  type ScheduleCardViewModel,
} from "../../supabase/functions/_shared/schedule-share-card/card.ts"
import { FONT_BASE64 } from "../../supabase/functions/_shared/setlist-share-card/generated/fonts.ts"
import { readImageDimensions } from "../../supabase/functions/_shared/image-dimensions.ts"
import { SCHEDULE_SHARE_IMAGE_ALLOWED_PROFILE_IDS } from "../../supabase/functions/_shared/schedule-share-card/access.ts"

/** 1080 wide is Instagram's native story width; the 9∶16 frame lands at 1919. */
const DEFAULT_WIDTH_PX = 1080

/**
 * JPEG for downloads — smaller, and indistinguishable at this quality.
 *
 * PNG exists for one caller: `radio-schedule-share-upload` only accepts a
 * `.png` path, and `/social-radio-schedule` only lists `.png` files, so the
 * upload action on the page asks for PNG rather than making an edge function
 * and a public page learn a second extension.
 */
type OutputFormat = "jpeg" | "png"
/** Guard rail, not a real ceiling — an absurd `width` must not burn 60s of CPU. */
const MAX_WIDTH_PX = 2160
const DEFAULT_QUALITY = 88

/** Longest a single row's artwork may take before the card renders without it. */
const ARTWORK_TIMEOUT_MS = 6000
const ARTWORK_MAX_BYTES = 8 * 1024 * 1024

const FONTS = [
  { base64: FONT_BASE64.geist400, name: "Geist", weight: 400 },
  { base64: FONT_BASE64.geist500, name: "Geist", weight: 500 },
  { base64: FONT_BASE64.geist600, name: "Geist", weight: 600 },
  { base64: FONT_BASE64.geist700, name: "Geist", weight: 700 },
  { base64: FONT_BASE64.geistMono500, name: "Geist Mono", weight: 500 },
  { base64: FONT_BASE64.geistMono700, name: "Geist Mono", weight: 700 },
] as const

const fonts = FONTS.map((f) => ({
  name: f.name,
  data: Buffer.from(f.base64, "base64"),
  weight: f.weight as 400 | 500 | 600 | 700,
  style: "normal" as const,
}))

/** A query number, clamped — `Number("abc")` is NaN, which would poison Math.max. */
function clampedParam(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = raw === null ? fallback : Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

/* ─────────────────────────── auth ─────────────────────────────── */

function base64UrlToBuffer(part: string): Buffer {
  return Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64")
}

/**
 * Verifies the site's own session JWT (HS256, issued by `sso-callback`).
 *
 * `jose` is not a dependency here and this is the only token this function
 * ever sees, so the three-line HMAC check is done directly rather than pulling
 * a library into the bundle.
 */
function verifySessionToken(
  token: string,
  secret: string,
): Record<string, unknown> | null {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string]

  let header: { alg?: string }
  let payload: Record<string, unknown>
  try {
    header = JSON.parse(base64UrlToBuffer(headerB64).toString("utf8"))
    payload = JSON.parse(base64UrlToBuffer(payloadB64).toString("utf8"))
  } catch {
    return null
  }
  if (header.alg !== "HS256") return null

  const expected = createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest()
  const presented = base64UrlToBuffer(signatureB64)
  if (presented.length !== expected.length) return null
  if (!timingSafeEqual(presented, expected)) return null

  const exp = payload.exp
  if (typeof exp !== "number" || Date.now() / 1000 >= exp) return null
  return payload
}

/** Admins, plus the individually allowlisted profiles. */
function mayRenderSchedule(payload: Record<string, unknown>): boolean {
  if (payload.is_admin === true) return true
  const profileId = payload.profile_id
  return (
    typeof profileId === "string" &&
    SCHEDULE_SHARE_IMAGE_ALLOWED_PROFILE_IDS.includes(profileId)
  )
}

/* ───────────────────────── artwork ────────────────────────────── */

/** Same allowlist as `supabase/functions/schedule-share-image-proxy`. */
function isAllowedArtworkHost(url: URL): boolean {
  if (url.protocol !== "https:") return false
  const h = url.hostname.toLowerCase()
  if (h === "radio.co" || h.endsWith(".radio.co")) return true
  if (h === "postimg.cc" || h.endsWith(".postimg.cc")) return true
  if (h.endsWith(".supabase.co")) {
    return (
      url.pathname.startsWith("/storage/v1/object/") ||
      url.pathname.startsWith("/storage/v1/render/")
    )
  }
  return false
}

type ResolvedArtwork = { dataUri: string; aspect: number }

/**
 * Fetches one row's artwork and returns it as a data URI plus its aspect ratio.
 *
 * Returns null on anything unexpected: the card draws a placeholder tile in
 * that slot rather than failing the whole render for one missing image.
 */
async function resolveArtwork(href: string): Promise<ResolvedArtwork | null> {
  const trimmed = href.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("data:")) return { dataUri: trimmed, aspect: 1 }

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  if (!isAllowedArtworkHost(url)) return null

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(ARTWORK_TIMEOUT_MS),
      headers: {
        "User-Agent": "wl-org-schedule-share-image/1.0",
        Accept: "image/*,*/*;q=0.8",
      },
    })
    if (!res.ok) return null
    if (!isAllowedArtworkHost(new URL(res.url))) return null

    const bytes = new Uint8Array(await res.arrayBuffer())
    if (bytes.byteLength === 0 || bytes.byteLength > ARTWORK_MAX_BYTES) return null

    const dims = readImageDimensions(bytes)
    const contentType =
      res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg"
    if (!contentType.startsWith("image/")) return null

    return {
      dataUri: `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`,
      aspect: dims ? dims.width / dims.height : 1,
    }
  } catch {
    return null
  }
}

/** Resolves every row's artwork in parallel, de-duplicated by URL. */
async function resolveRowArtwork(
  rows: ScheduleCardRow[],
): Promise<ScheduleCardRow[]> {
  const unique = [
    ...new Set(rows.map((r) => r.artSrc?.trim()).filter((s): s is string => !!s)),
  ]
  const resolved = new Map<string, ResolvedArtwork | null>()
  await Promise.all(
    unique.map(async (href) => resolved.set(href, await resolveArtwork(href))),
  )
  return rows.map((row) => {
    const hit = row.artSrc ? resolved.get(row.artSrc.trim()) : null
    return {
      ...row,
      artSrc: hit?.dataUri ?? null,
      artAspect: hit?.aspect ?? 1,
    }
  })
}

/* ───────────────────────── handler ────────────────────────────── */

/** Rejects a view model that would render nonsense or cost unbounded work. */
function readViewModel(raw: unknown): ScheduleCardViewModel | string {
  if (!raw || typeof raw !== "object") return "viewModel is required"
  const vm = raw as Partial<ScheduleCardViewModel>
  if (typeof vm.dateLabel !== "string" || !vm.dateLabel.trim()) {
    return "viewModel.dateLabel is required"
  }
  if (!Array.isArray(vm.rows)) return "viewModel.rows is required"
  if (vm.rows.length > 24) return "viewModel.rows is too long"
  for (const row of vm.rows) {
    if (typeof row?.title !== "string" || typeof row?.timeRange !== "string") {
      return "Each row needs a title and a timeRange"
    }
  }
  return {
    dateLabel: vm.dateLabel,
    emptyMessage: vm.emptyMessage ?? null,
    rows: vm.rows.map((row, i) => ({
      key: String(row.key ?? i),
      timeRange: row.timeRange,
      title: row.title,
      artSrc: typeof row.artSrc === "string" ? row.artSrc : null,
      tightArtRadius: row.tightArtRadius === true,
    })),
  }
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    })
  }
  if (req.method !== "POST") {
    return jsonError("POST a { dayKey, viewModel } body", 405)
  }

  const secret = process.env.WYSTERIA_JWT_SECRET
  if (!secret) return jsonError("WYSTERIA_JWT_SECRET is not configured", 500)

  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!bearer) return jsonError("Unauthorized", 401)
  const payload = verifySessionToken(bearer.trim(), secret)
  if (!payload) return jsonError("Unauthorized", 401)
  if (!mayRenderSchedule(payload)) return jsonError("Forbidden", 403)

  const body = (await req.json().catch(() => null)) as {
    dayKey?: string
    viewModel?: unknown
  } | null

  const dayKey = typeof body?.dayKey === "string" ? body.dayKey : ""
  if (!dayKey) return jsonError("dayKey is required", 400)

  const vmOrError = readViewModel(body?.viewModel)
  if (typeof vmOrError === "string") return jsonError(vmOrError, 400)

  const format: OutputFormat =
    url.searchParams.get("format") === "png" ? "png" : "jpeg"
  const quality = clampedParam(
    url.searchParams.get("quality"),
    DEFAULT_QUALITY,
    40,
    100,
  )
  const width = clampedParam(
    url.searchParams.get("width"),
    DEFAULT_WIDTH_PX,
    SCHEDULE_CARD_WIDTH_PX,
    MAX_WIDTH_PX,
  )

  try {
    const t0 = Date.now()
    const rows = await resolveRowArtwork(vmOrError.rows)
    const artworkMs = Date.now() - t0

    const t1 = Date.now()
    const svg = await satori(
      buildScheduleShareCard(
        { ...vmOrError, rows },
        scheduleCardAssets(pickScheduleBackgroundStem(dayKey)),
      ) as never,
      {
        width: SCHEDULE_CARD_WIDTH_PX,
        height: SCHEDULE_CARD_HEIGHT_PX,
        /*
         * Outlined, as in the setlist renderer: `@resvg/resvg-js` takes font
         * *paths* rather than buffers, so leaving text as <text> sends it
         * hunting through system fonts — wrong glyphs and a slow scan.
         */
        embedFont: true as const,
        fonts,
      },
    )
    const satoriMs = Date.now() - t1

    const t2 = Date.now()
    const image = new Resvg(svg, {
      fitTo: { mode: "width", value: width },
      font: { loadSystemFonts: false }, // nothing to find; skip the scan
    }).render()
    const resvgMs = Date.now() - t2

    const t3 = Date.now()
    const body =
      format === "png" ?
        Buffer.from(image.asPng())
      : Buffer.from(
          jpeg.encode(
            {
              data: Buffer.from(image.pixels),
              width: image.width,
              height: image.height,
            },
            quality,
          ).data,
        )
    const encodeMs = Date.now() - t3

    if (url.searchParams.get("debug") === "1") {
      return new Response(
        JSON.stringify({
          ok: true,
          runtime: "netlify",
          dayKey,
          background: pickScheduleBackgroundStem(dayKey),
          rows: rows.length,
          artworkResolved: rows.filter((r) => r.artSrc).length,
          width: image.width,
          height: image.height,
          megapixels: +((image.width * image.height) / 1e6).toFixed(3),
          format,
          bytes: body.length,
          timings: { artworkMs, satoriMs, resvgMs, encodeMs },
        }),
        { headers: { "Content-Type": "application/json" } },
      )
    }

    return new Response(body, {
      headers: {
        "Content-Type": format === "png" ? "image/png" : "image/jpeg",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("schedule share render failed:", err)
    return jsonError(`Render failed: ${String(err)}`, 500)
  }
}

export const config = { path: "/api/schedule-share-image" }
