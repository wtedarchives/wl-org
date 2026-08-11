export type ImageDimensions = { width: number; height: number }

/**
 * Pixel dimensions from raw image bytes, without decoding the image.
 *
 * Bluesky's `app.bsky.embed.images` takes an optional `aspectRatio`; when it's
 * omitted clients can't reserve the right box before the image loads and fall
 * back to a square container, letterboxing anything that isn't square. Deno has
 * no image decoder, so the headers are parsed directly.
 *
 * Returns undefined for formats or truncated data it can't read — the caller
 * then omits `aspectRatio` rather than sending a wrong one.
 */
export function readImageDimensions(
  bytes: Uint8Array,
): ImageDimensions | undefined {
  return (
    readPngDimensions(bytes) ??
    readJpegDimensions(bytes) ??
    readGifDimensions(bytes) ??
    readWebpDimensions(bytes)
  )
}

const beU16 = (b: Uint8Array, i: number): number => (b[i] << 8) | b[i + 1]
const leU16 = (b: Uint8Array, i: number): number => b[i] | (b[i + 1] << 8)
const beU32 = (b: Uint8Array, i: number): number =>
  ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
const leU24 = (b: Uint8Array, i: number): number =>
  b[i] | (b[i + 1] << 8) | (b[i + 2] << 16)

const ascii = (b: Uint8Array, i: number, length: number): string =>
  String.fromCharCode(...b.subarray(i, i + length))

const valid = (
  width: number,
  height: number,
): ImageDimensions | undefined =>
  width > 0 && height > 0 ? { width, height } : undefined

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** IHDR is always the first chunk: width/height are big-endian u32 at 16/20. */
function readPngDimensions(bytes: Uint8Array): ImageDimensions | undefined {
  if (bytes.byteLength < 24) return undefined
  for (let i = 0; i < PNG_SIGNATURE.length; i += 1) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return undefined
  }
  return valid(beU32(bytes, 16), beU32(bytes, 20))
}

/** Markers carrying no payload — walking past these must not read a length. */
const JPEG_STANDALONE_MARKERS = new Set([
  0x01, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9,
])

/** SOF0–SOF15, excluding DHT (0xc4), JPG (0xc8) and DAC (0xcc). */
const isJpegStartOfFrame = (marker: number): boolean =>
  marker >= 0xc0 && marker <= 0xcf &&
  marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc

function readJpegDimensions(bytes: Uint8Array): ImageDimensions | undefined {
  if (bytes.byteLength < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return undefined
  }

  let offset = 2
  while (offset < bytes.byteLength - 1) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }
    // Runs of 0xff are legal padding before the marker byte.
    let marker = bytes[offset + 1]
    let markerAt = offset + 1
    while (marker === 0xff && markerAt + 1 < bytes.byteLength) {
      markerAt += 1
      marker = bytes[markerAt]
    }

    if (JPEG_STANDALONE_MARKERS.has(marker)) {
      offset = markerAt + 1
      continue
    }
    // Start of scan — no frame header past this point.
    if (marker === 0xda) return undefined

    const lengthAt = markerAt + 1
    if (lengthAt + 1 >= bytes.byteLength) return undefined
    const segmentLength = beU16(bytes, lengthAt)
    if (segmentLength < 2) return undefined

    if (isJpegStartOfFrame(marker)) {
      // Payload: precision(1), height(2), width(2).
      if (lengthAt + 6 >= bytes.byteLength) return undefined
      return valid(beU16(bytes, lengthAt + 5), beU16(bytes, lengthAt + 3))
    }

    offset = lengthAt + segmentLength
  }
  return undefined
}

function readGifDimensions(bytes: Uint8Array): ImageDimensions | undefined {
  if (bytes.byteLength < 10) return undefined
  const header = ascii(bytes, 0, 6)
  if (header !== "GIF87a" && header !== "GIF89a") return undefined
  return valid(leU16(bytes, 6), leU16(bytes, 8))
}

function readWebpDimensions(bytes: Uint8Array): ImageDimensions | undefined {
  if (bytes.byteLength < 30) return undefined
  if (ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") {
    return undefined
  }

  const chunk = ascii(bytes, 12, 4)

  // Extended format: 24-bit canvas width-1 / height-1.
  if (chunk === "VP8X") {
    return valid(leU24(bytes, 24) + 1, leU24(bytes, 27) + 1)
  }

  // Lossy: 14-bit dimensions after the 3-byte start code and 0x9d012a sync.
  if (chunk === "VP8 ") {
    return valid(leU16(bytes, 26) & 0x3fff, leU16(bytes, 28) & 0x3fff)
  }

  // Lossless: 14 bits width-1 then 14 bits height-1, little-endian bitstream.
  if (chunk === "VP8L") {
    if (bytes.byteLength < 25) return undefined
    const bits =
      bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)
    return valid((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1)
  }

  return undefined
}
