/**
 * html-to-image captures a rectangular bitmap; CSS `border-radius` does not produce
 * transparent corners in the PNG. Clip the raster to match the on-screen rounded frame.
 */
export async function applyShareExportRoundedCorners(
  blob: Blob,
  options: {
    borderRadiusPx: number
    designWidthPx: number
  },
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext("2d", { alpha: true })
  if (!ctx) {
    bitmap.close()
    throw new Error("Canvas 2D unavailable")
  }

  const scale = bitmap.width / options.designWidthPx
  const radius = Math.max(0, options.borderRadiusPx * scale)

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  clipRoundedRect(ctx, 0, 0, canvas.width, canvas.height, radius)
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob failed"))),
      "image/png",
    )
  })
}

function clipRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (r <= 0) return
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radius)
  } else {
    const right = x + w
    const bottom = y + h
    ctx.moveTo(x + radius, y)
    ctx.lineTo(right - radius, y)
    ctx.quadraticCurveTo(right, y, right, y + radius)
    ctx.lineTo(right, bottom - radius)
    ctx.quadraticCurveTo(right, bottom, right - radius, bottom)
    ctx.lineTo(x + radius, bottom)
    ctx.quadraticCurveTo(x, bottom, x, bottom - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }
  ctx.clip()
}
