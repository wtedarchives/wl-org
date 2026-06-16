export const DISCOURSE_EMOJI_CDN = "https://emoji.discourse-cdn.com/twemoji"

export type DiscourseEmojiImage = {
  /** Discourse shortcode token, e.g. `:smiling_face_with_sunglasses:` */
  shortcode: string
  src: string
}

function readHtmlAttribute(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(["'])([^"']*)\\1`, "i"),
  )
  return match?.[2]?.trim() ?? null
}

function normalizeDiscourseEmojiShortcode(raw: string): string {
  const inner = raw.replace(/^:|:$/g, "").trim().toLowerCase()
  return inner ? `:${inner}:` : ""
}

function resolveEmojiAssetUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  if (trimmed.startsWith("//")) return `https:${trimmed}`
  return trimmed
}

/** Build the standard Discourse twemoji CDN URL for a shortcode name. */
export function discourseEmojiCdnUrl(shortcodeName: string): string {
  const slug = shortcodeName.replace(/^:|:$/g, "").trim()
  if (!slug) return ""
  return `${DISCOURSE_EMOJI_CDN}/${encodeURIComponent(slug)}.png?v=15`
}

/** Extract emoji `<img>` tags from Discourse `cooked` HTML. */
export function extractDiscourseEmojiImages(
  cooked: string,
): DiscourseEmojiImage[] {
  const emojis: DiscourseEmojiImage[] = []
  const seen = new Set<string>()

  for (const match of cooked.matchAll(/<img\b[^>]*\bemoji\b[^>]*>/gi)) {
    const tag = match[0] ?? ""
    const alt = readHtmlAttribute(tag, "alt") || readHtmlAttribute(tag, "title")
    const srcRaw = readHtmlAttribute(tag, "src")
    const shortcode = alt ? normalizeDiscourseEmojiShortcode(alt) : ""
    if (!shortcode || seen.has(shortcode)) continue

    const src = srcRaw ?
        resolveEmojiAssetUrl(srcRaw)
      : discourseEmojiCdnUrl(shortcode)
    if (!src) continue

    seen.add(shortcode)
    emojis.push({ shortcode, src })
  }

  return emojis
}
