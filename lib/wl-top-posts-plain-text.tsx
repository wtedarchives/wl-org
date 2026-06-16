import type { ReactNode } from "react"

export type DiscourseEmojiImage = {
  shortcode: string
  src: string
}

export const DISCOURSE_EMOJI_CDN = "https://emoji.discourse-cdn.com/twemoji"

const DISCOURSE_EMOJI_SHORTCODE_RE = /:([a-z0-9_+-]+):/gi

/** Build the standard Discourse twemoji CDN URL for a shortcode name. */
export function discourseEmojiCdnUrl(shortcodeName: string): string {
  const slug = shortcodeName.replace(/^:|:$/g, "").trim()
  if (!slug) return ""
  return `${DISCOURSE_EMOJI_CDN}/${encodeURIComponent(slug)}.png?v=15`
}

function normalizeDiscourseEmojiShortcode(raw: string): string {
  const inner = raw.replace(/^:|:$/g, "").trim().toLowerCase()
  return inner ? `:${inner}:` : ""
}

/** Strip upload filenames that may leak through older extraction payloads. */
export function formatWlTopPostPlainText(text: string): string {
  return text
    .replace(
      /\b[\w.-]+\.(jpe?g|png|gif|webp|heic|heif|bmp|mp|m4v|mov)\b/gi,
      " ",
    )
    .replace(/\bPXL_\d{8}_\d+\.\w+\b/gi, " ")
    .replace(/\b\d{8}_\d{6}\b/g, " ")
    .replace(/\bIMG[_-]?\d+\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function resolveEmojiSrc(
  shortcode: string,
  emojiImages?: DiscourseEmojiImage[],
): string {
  const normalized = normalizeDiscourseEmojiShortcode(shortcode)
  const fromPayload = emojiImages?.find(
    (entry) => entry.shortcode.toLowerCase() === normalized,
  )?.src
  return fromPayload ?? discourseEmojiCdnUrl(normalized)
}

/** Split plain text on Discourse `:shortcode:` tokens for inline emoji rendering. */
export function renderWlTopPostPlainText(
  text: string,
  emojiImages?: DiscourseEmojiImage[],
): ReactNode[] {
  const cleaned = formatWlTopPostPlainText(text)
  if (!cleaned) return []

  const nodes: ReactNode[] = []
  let lastIndex = 0
  DISCOURSE_EMOJI_SHORTCODE_RE.lastIndex = 0

  for (
    let match = DISCOURSE_EMOJI_SHORTCODE_RE.exec(cleaned);
    match;
    match = DISCOURSE_EMOJI_SHORTCODE_RE.exec(cleaned)
  ) {
    const start = match.index ?? 0
    if (start > lastIndex) {
      nodes.push(cleaned.slice(lastIndex, start))
    }

    const shortcode = normalizeDiscourseEmojiShortcode(match[0])
    nodes.push(
      <img
        key={`emoji-${start}-${shortcode}`}
        src={resolveEmojiSrc(shortcode, emojiImages)}
        alt=""
        className="wl-top-posts__body-emoji"
      />,
    )
    lastIndex = start + match[0].length
  }

  if (lastIndex < cleaned.length) {
    nodes.push(cleaned.slice(lastIndex))
  }

  return nodes
}
