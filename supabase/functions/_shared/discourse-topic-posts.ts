import {
  extractDiscourseEmojiImages,
  type DiscourseEmojiImage,
} from "./discourse-emoji.ts"

export const COMMUNITY_ORIGIN = "https://community.wysterialane.org"

const POST_IDS_BATCH_SIZE = 100
const TOP_POSTS_LIMIT = 10
const CACHE_TTL_MS = 30 * 60 * 1000
/** Bump when payload shape / extraction logic changes (invalidates in-memory cache). */
const CACHE_VERSION = 10

export type DiscoursePostDisplayMode =
  | "image-only"
  | "text-and-image"
  | "text-only"
  | "empty"

export type DiscoursePostExtractionDebug = {
  cookedLength: number
  cookedPreview: string
  pipeline: Array<{
    step: string
    summary: string
    data?: Record<string, unknown>
  }>
  imageUrls: string[]
  previewImageUrl: string | null
  textSourcePreview: string
  rawPlainText: string
  plainText: string
  displayMode: DiscoursePostDisplayMode
  renderPlan: {
    showPreviewImage: boolean
    showPlainText: boolean
    previewImageLayout: "full-width" | "float-right" | "none"
    plainTextLayout: "wrap-beside-image" | "full-width" | "none"
  }
}

export type DiscourseTopPostPayload = {
  id: number
  username: string
  display_username: string
  /** Null when user has no custom profile photo (client shows /WL.png). */
  avatar_url: string | null
  plain_text: string
  emoji_images: DiscourseEmojiImage[]
  preview_image_url: string | null
  display_mode: DiscoursePostDisplayMode
  extraction_debug: DiscoursePostExtractionDebug
  post_url: string
  score: number
  post_number: number
}

type DiscoursePost = {
  id?: number
  post_number?: number
  score?: number
  cooked?: string
  avatar_template?: string
  username?: string
  display_username?: string
  post_url?: string
  deleted_at?: string | null
  hidden?: boolean
  user_deleted?: boolean
}

type TopicJson = {
  post_stream?: {
    posts?: DiscoursePost[]
    stream?: number[]
  }
}

type PostsBatchJson = {
  post_stream?: {
    posts?: DiscoursePost[]
  }
}

const responseCache = new Map<
  string,
  { expiresAt: number; body: { posts: DiscourseTopPostPayload[] } }
>()

export function getDiscourseAuthHeaders(): {
  headers: Record<string, string> | null
  configError: string | null
} {
  const apiKey = Deno.env.get("DISCOURSE_API_KEY")?.trim()
  const apiUsername = Deno.env.get("DISCOURSE_API_USERNAME")?.trim()
  if (!apiKey || !apiUsername) {
    return {
      headers: null,
      configError:
        "supabase secrets set DISCOURSE_API_KEY=... DISCOURSE_API_USERNAME=... && supabase functions deploy discourse-topic-top-posts",
    }
  }
  return {
    headers: {
      "Api-Key": apiKey,
      "Api-Username": apiUsername,
      Accept: "application/json",
    },
    configError: null,
  }
}

function previewSnippet(value: string, maxLen = 280): string {
  const trimmed = value.trim()
  if (trimmed.length <= maxLen) return trimmed
  return `${trimmed.slice(0, maxLen)}…`
}

function isDiscourseDefaultAvatar(
  avatarTemplate: string | null | undefined,
): boolean {
  if (typeof avatarTemplate !== "string" || !avatarTemplate.trim()) return true
  return /letter_avatar_proxy/i.test(avatarTemplate)
}

function discourseAvatarUrl(
  avatarTemplate: string | null | undefined,
): string | null {
  if (isDiscourseDefaultAvatar(avatarTemplate)) return null
  const resolved = avatarTemplate!.replace("{size}", "48")
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    return resolved
  }
  if (resolved.startsWith("//")) return `https:${resolved}`
  return `${COMMUNITY_ORIGIN}${resolved}`
}

function isEmojiImgTag(tag: string): boolean {
  return /\bclass\s*=\s*["'][^"']*\bemoji\b/i.test(tag)
}

function readHtmlAttribute(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(["'])([^"']*)\\1`, "i"),
  )
  return match?.[2]?.trim() ?? null
}

function resolveCommunityAssetUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  if (trimmed.startsWith("//")) return `https:${trimmed}`
  if (trimmed.startsWith("/")) return `${COMMUNITY_ORIGIN}${trimmed}`
  return trimmed
}

function extractImageUrlFromImgTag(tag: string): string | null {
  const src =
    readHtmlAttribute(tag, "src") ||
    readHtmlAttribute(tag, "data-src") ||
    readHtmlAttribute(tag, "data-orig-src")
  if (src) return resolveCommunityAssetUrl(src)

  const srcset = readHtmlAttribute(tag, "srcset")
  if (!srcset) return null
  const first = srcset.split(",")[0]?.trim().split(/\s+/)[0]
  return first ? resolveCommunityAssetUrl(first) : null
}

function extractLightboxImageUrls(html: string): string[] {
  const urls: string[] = []
  const anchorRegex =
    /<a\b[^>]*class\s*=\s*["'][^"']*\blightbox\b[^"']*["'][^>]*>/gi
  for (const match of html.matchAll(anchorRegex)) {
    const tag = match[0] ?? ""
    const href = readHtmlAttribute(tag, "href")
    if (href) urls.push(resolveCommunityAssetUrl(href))
  }
  return urls
}

/** Prefer full-size lightbox href, then onebox thumbnail, then other inline imgs. */
function collectPostImageUrls(html: string): string[] {
  const urls: string[] = []
  for (const url of extractLightboxImageUrls(html)) {
    if (!urls.includes(url)) urls.push(url)
  }
  for (const url of extractOneboxImageUrls(html)) {
    if (!urls.includes(url)) urls.push(url)
  }

  let withoutEmbeds = removeOneboxBlocks(html)
  withoutEmbeds = removeBalancedDivClassBlocks(withoutEmbeds, "lightbox-wrapper")
  withoutEmbeds = withoutEmbeds.replace(
    /<a[^>]*\blightbox\b[^>]*>[\s\S]*?<\/a>/gi,
    "",
  )
  for (const tag of withoutEmbeds.matchAll(/<img\b[^>]*>/gi)) {
    const imgTag = tag[0] ?? ""
    if (isEmojiImgTag(imgTag)) continue
    const imageUrl = extractImageUrlFromImgTag(imgTag)
    if (imageUrl && !urls.includes(imageUrl)) urls.push(imageUrl)
  }
  return urls
}

/** Inner HTML of a `<div>...</div>` block starting at `openTagStart` (depth-balanced). */
function extractBalancedDivContent(
  html: string,
  openTagStart: number,
): { inner: string; endIndex: number } | null {
  const openTagMatch = html.slice(openTagStart).match(/^<div\b[^>]*>/i)
  if (!openTagMatch) return null

  const innerStart = openTagStart + openTagMatch[0].length
  let depth = 1
  const tagRegex = /<\/?div\b[^>]*>/gi
  tagRegex.lastIndex = innerStart

  for (let match = tagRegex.exec(html); match; match = tagRegex.exec(html)) {
    if (match[0].startsWith("</")) depth -= 1
    else depth += 1
    if (depth === 0) {
      return {
        inner: html.slice(innerStart, match.index),
        endIndex: (match.index ?? 0) + match[0].length,
      }
    }
  }
  return null
}

function forEachLightboxWrapperInner(
  html: string,
  visit: (innerHtml: string) => void,
): void {
  const regex = /<div[^>]*\blightbox-wrapper\b[^>]*>/gi
  for (const match of html.matchAll(regex)) {
    const start = match.index ?? 0
    const parsed = extractBalancedDivContent(html, start)
    if (parsed) visit(parsed.inner)
  }
}

/** Inner HTML of an `<a>...</a>` block starting at `openTagStart` (depth-balanced). */
function extractBalancedAnchorContent(
  html: string,
  openTagStart: number,
): { inner: string; endIndex: number } | null {
  const openTagMatch = html.slice(openTagStart).match(/^<a\b[^>]*>/i)
  if (!openTagMatch) return null

  const innerStart = openTagStart + openTagMatch[0].length
  let depth = 1
  const tagRegex = /<\/?a\b[^>]*>/gi
  tagRegex.lastIndex = innerStart

  for (let match = tagRegex.exec(html); match; match = tagRegex.exec(html)) {
    if (match[0].startsWith("</")) depth -= 1
    else depth += 1
    if (depth === 0) {
      return {
        inner: html.slice(innerStart, match.index),
        endIndex: (match.index ?? 0) + match[0].length,
      }
    }
  }
  return null
}

function removeBalancedDivClassBlocks(html: string, className: string): string {
  const regex = new RegExp(`<div[^>]*\\b${className}\\b[^>]*>`, "gi")
  const removals: Array<{ start: number; end: number }> = []
  for (const match of html.matchAll(regex)) {
    const start = match.index ?? 0
    const parsed = extractBalancedDivContent(html, start)
    if (parsed) removals.push({ start, end: parsed.endIndex })
  }
  removals.sort((a, b) => b.start - a.start)
  let out = html
  for (const removal of removals) {
    out = out.slice(0, removal.start) + out.slice(removal.end)
  }
  return out
}

/** Inner HTML of an `<aside>...</aside>` block starting at `openTagStart` (depth-balanced). */
function extractBalancedAsideContent(
  html: string,
  openTagStart: number,
): { inner: string; endIndex: number } | null {
  const openTagMatch = html.slice(openTagStart).match(/^<aside\b[^>]*>/i)
  if (!openTagMatch) return null

  const innerStart = openTagStart + openTagMatch[0].length
  let depth = 1
  const tagRegex = /<\/?aside\b[^>]*>/gi
  tagRegex.lastIndex = innerStart

  for (let match = tagRegex.exec(html); match; match = tagRegex.exec(html)) {
    if (match[0].startsWith("</")) depth -= 1
    else depth += 1
    if (depth === 0) {
      return {
        inner: html.slice(innerStart, match.index),
        endIndex: (match.index ?? 0) + match[0].length,
      }
    }
  }
  return null
}

function removeBalancedAsideBlocks(html: string, className: string): string {
  const regex = new RegExp(`<aside[^>]*\\b${className}\\b[^>]*>`, "gi")
  const removals: Array<{ start: number; end: number }> = []
  for (const match of html.matchAll(regex)) {
    const start = match.index ?? 0
    const parsed = extractBalancedAsideContent(html, start)
    if (parsed) removals.push({ start, end: parsed.endIndex })
  }
  removals.sort((a, b) => b.start - a.start)
  let out = html
  for (const removal of removals) {
    out = out.slice(0, removal.start) + out.slice(removal.end)
  }
  return out
}

function collectOneboxInners(html: string): string[] {
  const inners: string[] = []
  const regex = /<aside\b[^>]*\bonebox\b[^>]*>/gi
  for (const match of html.matchAll(regex)) {
    const start = match.index ?? 0
    const parsed = extractBalancedAsideContent(html, start)
    if (parsed) inners.push(parsed.inner)
  }
  return inners
}

function isOneboxChromeImageTag(tag: string): boolean {
  return /\b(?:site-icon|site_icon|favicon|onebox-avatar-inline)\b/i.test(tag)
}

function extractOneboxPreviewImageFromInner(oneboxInner: string): string | null {
  for (const match of oneboxInner.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0] ?? ""
    if (isEmojiImgTag(tag) || isOneboxChromeImageTag(tag)) continue
    if (/\bthumbnail\b/i.test(tag)) {
      const url = extractImageUrlFromImgTag(tag)
      if (url) return url
    }
  }

  const bodyMatch = oneboxInner.match(
    /<article[^>]*\bonebox-body\b[^>]*>([\s\S]*?)<\/article>/i,
  )
  const searchIn = bodyMatch?.[1] ?? oneboxInner
  for (const match of searchIn.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0] ?? ""
    if (isEmojiImgTag(tag) || isOneboxChromeImageTag(tag)) continue
    const url = extractImageUrlFromImgTag(tag)
    if (url) return url
  }
  return null
}

function extractOneboxImageUrls(html: string): string[] {
  const urls: string[] = []
  for (const inner of collectOneboxInners(html)) {
    const url = extractOneboxPreviewImageFromInner(inner)
    if (url && !urls.includes(url)) urls.push(url)
  }
  return urls
}

function extractOneboxPlainTextFromInner(oneboxInner: string): string {
  const parts: string[] = []
  const bodyMatch = oneboxInner.match(
    /<article[^>]*\bonebox-body\b[^>]*>([\s\S]*?)<\/article>/i,
  )
  const body = bodyMatch?.[1] ?? oneboxInner

  for (const match of body.matchAll(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/gi)) {
    pushCaptionCandidate(parts, stripHtmlToPlainText(match[1] ?? ""))
  }
  for (const match of body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    pushCaptionCandidate(parts, stripHtmlToPlainText(match[1] ?? ""))
  }

  return mergePlainTextSegments(...parts)
}

function extractOneboxTextSegments(html: string): string[] {
  const segments: string[] = []
  for (const inner of collectOneboxInners(html)) {
    const text = extractOneboxPlainTextFromInner(inner)
    if (text) segments.push(text)
  }
  return segments
}

function removeOneboxBlocks(html: string): string {
  return removeBalancedAsideBlocks(html, "onebox")
}

function stripUploadMarkupKeepingText(html: string): string {
  let out = html
  out = out.replace(/<div[^>]*\bmeta\b[^>]*>[\s\S]*?<\/div>/gi, "")
  out = out.replace(/<span[^>]*\bfilename\b[^>]*>[\s\S]*?<\/span>/gi, "")
  out = out.replace(/<span[^>]*\binformations\b[^>]*>[\s\S]*?<\/span>/gi, "")
  out = out.replace(/<img\b(?![^>]*\bemoji\b)[^>]*>/gi, "")
  return out
}

function stripImageMarkupKeepingText(html: string): string {
  let out = stripUploadMarkupKeepingText(html)
  out = out.replace(/<a[^>]*\blightbox\b[^>]*>[\s\S]*?<\/a>/gi, "")
  return out
}

/** Common still/video extensions Discourse uses in lightbox title/alt/filename metadata. */
const UPLOAD_FILENAME_EXTENSION =
  "jpe?g|png|gif|webp|heic|heif|bmp|mp|m4v|mov"

const UPLOAD_FILENAME_VALUE_RE = new RegExp(
  `^[\\w.-]+\\.(${UPLOAD_FILENAME_EXTENSION})$`,
  "i",
)

/** Google Pixel camera roll (e.g. PXL_20260615_212407797.MP). */
const PIXEL_CAMERA_FILENAME_RE = /^PXL_\d{8}_\d+\.\w+$/i

function isLikelyUploadMetadata(text: string): boolean {
  const value = text.trim()
  if (!value) return true
  if (/^\d+[×x]\d+$/i.test(value)) return true
  if (/^[\d.]+\s*(KB|MB|GB|bytes?)$/i.test(value)) return true
  if (UPLOAD_FILENAME_VALUE_RE.test(value)) return true
  if (PIXEL_CAMERA_FILENAME_RE.test(value)) return true
  if (/^image$/i.test(value)) return true
  // Camera-roll / screenshot filenames used as Discourse upload alt text.
  if (/^\d{8}_\d{6}$/.test(value)) return true
  if (/^IMG[_-]?\d+$/i.test(value)) return true
  if (/^P\d{7,}$/i.test(value)) return true
  if (/^Screenshot(?:\s*\(\d+\))?$/i.test(value)) return true
  if (/^\d{4}-\d{2}-\d{2}(?:[_\s]\d{2}[.\-_]\d{2}[.\-_]\d{2})?$/.test(value)) {
    return true
  }
  return false
}

function uniqueNonEmptyStrings(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

function mergePlainTextSegments(...segments: string[]): string {
  return uniqueNonEmptyStrings(segments)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Discourse often places captions (e.g. "Surprise!") inside `.lightbox-wrapper`
 * alongside the image — those blocks are removed later, so rescue text first.
 */
function pushCaptionCandidate(captions: string[], text: string): void {
  const trimmed = text.trim()
  if (!trimmed || isLikelyUploadMetadata(trimmed)) return
  captions.push(trimmed)
}

function extractImageBlockCaptions(html: string): string[] {
  const captions: string[] = []

  // Captions nested inside lightbox anchors (img + meta stripped, text kept).
  for (const match of html.matchAll(/<a\b[^>]*\blightbox\b[^>]*>/gi)) {
    const start = match.index ?? 0
    const parsed = extractBalancedAnchorContent(html, start)
    if (parsed) {
      pushCaptionCandidate(
        captions,
        stripHtmlToPlainText(stripUploadMarkupKeepingText(parsed.inner)),
      )
    }
    const title = readHtmlAttribute(match[0] ?? "", "title")
    if (title) pushCaptionCandidate(captions, title)
  }

  // Captions as siblings inside `.lightbox-wrapper` (outside the anchor).
  forEachLightboxWrapperInner(html, (inner) => {
    const withoutAnchors = inner.replace(
      /<a[^>]*\blightbox\b[^>]*>[\s\S]*?<\/a>/gi,
      "",
    )
    pushCaptionCandidate(
      captions,
      stripHtmlToPlainText(stripUploadMarkupKeepingText(withoutAnchors)),
    )
  })

  return uniqueNonEmptyStrings(captions)
}

function removeDiscourseImageBlocks(html: string): string {
  let out = html
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  out = out.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
  out = out.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "")
  out = out.replace(/<embed\b[^>]*>/gi, "")
  out = removeOneboxBlocks(out)
  out = removeBalancedDivClassBlocks(out, "lightbox-wrapper")
  out = out.replace(/<a[^>]*\blightbox\b[^>]*>[\s\S]*?<\/a>/gi, "")
  out = out.replace(/<div[^>]*\bmeta\b[^>]*>[\s\S]*?<\/div>/gi, "")
  out = out.replace(/<span[^>]*\bfilename\b[^>]*>[\s\S]*?<\/span>/gi, "")
  out = out.replace(/<span[^>]*\binformations\b[^>]*>[\s\S]*?<\/span>/gi, "")
  out = out.replace(/<img\b(?![^>]*\bemoji\b)[^>]*>/gi, "")
  return out
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 10)),
    )
}

function stripHtmlToPlainText(html: string): string {
  let out = html
  out = out.replace(/<img\b[^>]*\bemoji\b[^>]*>/gi, (tag) => {
    const alt = readHtmlAttribute(tag, "alt") || readHtmlAttribute(tag, "title")
    return alt ? ` ${alt} ` : " "
  })
  out = out.replace(/<br\s*\/?>/gi, "\n")
  out = out.replace(/<\/p>/gi, "\n")
  out = out.replace(/<\/div>/gi, "\n")
  out = out.replace(/<[^>]+>/g, " ")
  out = decodeHtmlEntities(out)
  return out.replace(/\s+/g, " ").trim()
}

/** Drop Discourse upload metadata so only user-written text remains. */
function cleanDiscoursePlainText(text: string): string {
  const uploadFilenameWordRe = new RegExp(
    `\\b[\\w.-]+\\.(${UPLOAD_FILENAME_EXTENSION})\\b`,
    "gi",
  )
  let out = text
  out = out.replace(/https?:\/\/\S+/gi, " ")
  out = out.replace(/\d+[×x]\d+/gi, " ")
  out = out.replace(/[\d.]+\s*(KB|MB|GB|bytes?)\b/gi, " ")
  out = out.replace(uploadFilenameWordRe, " ")
  out = out.replace(/\bPXL_\d{8}_\d+\.\w+\b/gi, " ")
  out = out.replace(/\b(?:screenshot|image)[_\s-]?[\w.-]*/gi, " ")
  out = out.replace(/\b\d{8}_\d{6}\b/g, " ")
  out = out.replace(/\bIMG[_-]?\d+\b/gi, " ")
  out = out.replace(/\s+/g, " ").trim()
  return out
}

function resolveDisplayMode(
  previewImageUrl: string | null,
  plainText: string,
): DiscoursePostDisplayMode {
  const hasImage = previewImageUrl != null
  const hasText = plainText.length > 0
  if (hasImage && hasText) return "text-and-image"
  if (hasImage) return "image-only"
  if (hasText) return "text-only"
  return "empty"
}

function buildRenderPlan(
  previewImageUrl: string | null,
  plainText: string,
): DiscoursePostExtractionDebug["renderPlan"] {
  const showPreviewImage = previewImageUrl != null
  const showPlainText = plainText.length > 0
  if (showPreviewImage && showPlainText) {
    return {
      showPreviewImage: true,
      showPlainText: true,
      previewImageLayout: "float-right",
      plainTextLayout: "wrap-beside-image",
    }
  }
  if (showPreviewImage) {
    return {
      showPreviewImage: true,
      showPlainText: false,
      previewImageLayout: "full-width",
      plainTextLayout: "none",
    }
  }
  if (showPlainText) {
    return {
      showPreviewImage: false,
      showPlainText: true,
      previewImageLayout: "none",
      plainTextLayout: "full-width",
    }
  }
  return {
    showPreviewImage: false,
    showPlainText: false,
    previewImageLayout: "none",
    plainTextLayout: "none",
  }
}

/** Parse Discourse `cooked` into preview image + plain text for the card. */
export function extractDiscoursePostContent(cooked: string): {
  plain_text: string
  emoji_images: DiscourseEmojiImage[]
  preview_image_url: string | null
  display_mode: DiscoursePostDisplayMode
  extraction_debug: DiscoursePostExtractionDebug
} {
  const pipeline: DiscoursePostExtractionDebug["pipeline"] = []
  const emoji_images = extractDiscourseEmojiImages(cooked)

  pipeline.push({
    step: "cooked_input",
    summary: "Start from Discourse post cooked HTML.",
    data: {
      cookedLength: cooked.length,
      cookedPreview: previewSnippet(cooked),
      emojiImages: emoji_images,
    },
  })

  const imageUrls = collectPostImageUrls(cooked)
  const oneboxInners = collectOneboxInners(cooked)
  pipeline.push({
    step: "find_images",
    summary: imageUrls.length > 0 ?
      `Found ${imageUrls.length} image URL(s) in cooked HTML.`
    : "No image URLs found in cooked HTML.",
    data: {
      imageUrls,
      oneboxCount: oneboxInners.length,
      oneboxImageUrls: extractOneboxImageUrls(cooked),
    },
  })

  const preview_image_url = imageUrls[0] ?? null
  pipeline.push({
    step: "choose_preview_image",
    summary: preview_image_url ?
      "Use the first image URL as the card preview (lightbox upload, then onebox thumbnail)."
    : "No preview image for this post.",
    data: { preview_image_url },
  })

  const oneboxTextSegments = extractOneboxTextSegments(cooked)
  pipeline.push({
    step: "extract_onebox_content",
    summary: oneboxInners.length > 0 ?
      `Found ${oneboxInners.length} onebox preview block(s); use thumbnail only (onebox title/description excluded from card text).`
    : "No Discourse onebox link-preview blocks in this post.",
    data: {
      oneboxCount: oneboxInners.length,
      oneboxTextSegmentsExcludedFromCard: oneboxTextSegments,
      oneboxPreviewImages: extractOneboxImageUrls(cooked),
    },
  })

  const imageBlockCaptions = extractImageBlockCaptions(cooked)
  pipeline.push({
    step: "extract_image_block_captions",
    summary: imageBlockCaptions.length > 0 ?
      `Rescued ${imageBlockCaptions.length} caption fragment(s) from image/lightbox blocks before removal.`
    : "No caption text found inside image/lightbox blocks.",
    data: { imageBlockCaptions },
  })

  const textSource = removeDiscourseImageBlocks(cooked)
  pipeline.push({
    step: "remove_image_blocks",
    summary:
      "Strip onebox previews, lightbox wrappers, upload meta, and non-emoji images from cooked HTML.",
    data: {
      textSourceLength: textSource.length,
      textSourcePreview: previewSnippet(textSource),
    },
  })

  const bodyPlainText = stripHtmlToPlainText(textSource)
  pipeline.push({
    step: "html_to_plain_text",
    summary: "Convert remaining HTML outside preview blocks to plain text.",
    data: { bodyPlainText: bodyPlainText || "(empty)" },
  })

  const rawPlainText = mergePlainTextSegments(bodyPlainText, ...imageBlockCaptions)
  pipeline.push({
    step: "merge_caption_and_body_text",
    summary:
      "Combine user body text with lightbox captions (onebox auto-generated title/description is excluded).",
    data: { rawPlainText: rawPlainText || "(empty)" },
  })

  const plain_text = cleanDiscoursePlainText(rawPlainText)
  pipeline.push({
    step: "clean_metadata",
    summary:
      "Remove Discourse upload metadata (dimensions, file sizes, filenames, URLs).",
    data: { plainText: plain_text || "(empty)" },
  })

  const display_mode = resolveDisplayMode(preview_image_url, plain_text)
  const renderPlan = buildRenderPlan(preview_image_url, plain_text)
  pipeline.push({
    step: "resolve_display_mode",
    summary: `Resolved display mode: ${display_mode}.`,
    data: {
      rules: {
        hasPreviewImage: preview_image_url != null,
        hasPlainText: plain_text.length > 0,
        imageOnly: display_mode === "image-only",
        textOnly: display_mode === "text-only",
        textAndImage: display_mode === "text-and-image",
      },
      renderPlan,
    },
  })

  const extraction_debug: DiscoursePostExtractionDebug = {
    cookedLength: cooked.length,
    cookedPreview: previewSnippet(cooked),
    pipeline,
    imageUrls,
    previewImageUrl: preview_image_url,
    textSourcePreview: previewSnippet(textSource),
    rawPlainText,
    plainText: plain_text,
    displayMode: display_mode,
    renderPlan,
  }

  return {
    plain_text,
    emoji_images,
    preview_image_url,
    display_mode,
    extraction_debug,
  }
}

function isVisibleDiscoursePost(post: DiscoursePost): post is DiscoursePost & {
  id: number
  cooked: string
  post_url: string
} {
  if (typeof post.id !== "number") return false
  if (post.deleted_at) return false
  if (post.hidden === true) return false
  if (post.user_deleted === true) return false
  if (typeof post.cooked !== "string" || !post.cooked.trim()) return false
  if (typeof post.post_url !== "string" || !post.post_url.trim()) return false
  return true
}

function logDiscoursePostDisplayDecision(
  post: DiscoursePost & { id: number },
  extracted: ReturnType<typeof extractDiscoursePostContent>,
  included: boolean,
): void {
  console.log("[discourse-topic-top-posts] post display decision", {
    post_id: post.id,
    post_number: post.post_number ?? null,
    username: post.username ?? null,
    avatar_template: post.avatar_template ?? null,
    score: post.score ?? null,
    includedInTopPosts: included,
    display_mode: extracted.display_mode,
    preview_image_url: extracted.preview_image_url,
    plain_text: extracted.plain_text,
    extraction_debug: extracted.extraction_debug,
  })
}

function normalizePost(post: DiscoursePost): DiscourseTopPostPayload | null {
  if (!isVisibleDiscoursePost(post)) return null
  const username =
    post.username?.trim() ||
    post.display_username?.trim() ||
    "community member"
  const extracted = extractDiscoursePostContent(post.cooked)
  const included = extracted.display_mode !== "empty"
  logDiscoursePostDisplayDecision(post, extracted, included)
  if (!included || extracted.display_mode === "empty") return null

  return {
    id: post.id,
    username,
    display_username: post.display_username?.trim() || username,
    avatar_url: discourseAvatarUrl(post.avatar_template),
    plain_text: extracted.plain_text,
    emoji_images: extracted.emoji_images,
    preview_image_url: extracted.preview_image_url,
    display_mode: extracted.display_mode,
    extraction_debug: extracted.extraction_debug,
    post_url: `${COMMUNITY_ORIGIN}${post.post_url}`,
    score: typeof post.score === "number" && Number.isFinite(post.score) ?
      post.score
    : 0,
    post_number:
      typeof post.post_number === "number" && Number.isFinite(post.post_number) ?
        post.post_number
      : 0,
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size))
  }
  return batches
}

async function fetchPostsByIds(
  topicId: number,
  postIds: number[],
  authHeaders: Record<string, string>,
): Promise<DiscoursePost[]> {
  if (postIds.length === 0) return []
  const params = new URLSearchParams()
  for (const id of postIds) {
    params.append("post_ids[]", String(id))
  }
  const res = await fetch(
    `${COMMUNITY_ORIGIN}/t/${topicId}/posts.json?${params.toString()}`,
    { headers: authHeaders },
  )
  if (!res.ok) {
    throw new Error(`Discourse posts batch returned ${res.status}`)
  }
  const json = (await res.json()) as PostsBatchJson
  return json.post_stream?.posts ?? []
}

export async function fetchDiscourseTopicTopPosts(
  topicId: number,
  authHeaders: Record<string, string>,
): Promise<{ posts: DiscourseTopPostPayload[]; cached: boolean }> {
  const cacheKey = `${topicId}:v${CACHE_VERSION}`
  const cached = responseCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return { posts: cached.body.posts, cached: true }
  }

  const topicRes = await fetch(`${COMMUNITY_ORIGIN}/t/${topicId}.json`, {
    headers: authHeaders,
  })
  if (topicRes.status === 404) {
    return { posts: [], cached: false }
  }
  if (!topicRes.ok) {
    throw new Error(`Discourse topic returned ${topicRes.status}`)
  }

  const topicJson = (await topicRes.json()) as TopicJson
  const stream = topicJson.post_stream?.stream ?? []
  const firstChunk = topicJson.post_stream?.posts ?? []

  const collected = new Map<number, DiscoursePost>()
  for (const post of firstChunk) {
    if (typeof post.id === "number") collected.set(post.id, post)
  }

  const missingIds = stream.filter((id) => !collected.has(id))
  for (const batch of chunk(missingIds, POST_IDS_BATCH_SIZE)) {
    const batchPosts = await fetchPostsByIds(topicId, batch, authHeaders)
    for (const post of batchPosts) {
      if (typeof post.id === "number") collected.set(post.id, post)
    }
  }

  const ranked = Array.from(collected.values())
    .map(normalizePost)
    .filter((post): post is DiscourseTopPostPayload => post != null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.post_number - a.post_number
    })
    .slice(0, TOP_POSTS_LIMIT)

  const body = { posts: ranked }
  responseCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    body,
  })

  return { posts: ranked, cached: false }
}

export const DISCOURSE_TOP_POSTS_CACHE_MAX_AGE_SEC = CACHE_TTL_MS / 1000
