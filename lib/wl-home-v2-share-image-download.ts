/**
 * Mobile image export: prefer `navigator.share({ files })` so iOS Safari users get the
 * system share sheet and can tap **Save Image** → Photos. Desktop / unsupported → `<a download>`.
 */

function isShareExportMobileContext(): boolean {
  if (typeof window === "undefined") return false
  const narrow = window.matchMedia?.("(max-width: 768px)")?.matches ?? false
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false
  const ua = navigator.userAgent || ""
  const iOS =
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  return narrow || coarse || iOS
}

/**
 * @returns `"shared"` if the share sheet was used (including user-dismissed `AbortError`),
 *   `"downloaded"` if anchor download ran.
 */
export async function downloadOrWebSharePng(
  blob: Blob,
  filename: string,
  options?: { shareTitle?: string },
): Promise<"shared" | "downloaded"> {
  const mime = blob.type && blob.type !== "" ? blob.type : "image/png"
  const file = new File([blob], filename, { type: mime })

  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })

  if (canShareFiles && isShareExportMobileContext()) {
    try {
      await navigator.share({
        files: [file],
        title: options?.shareTitle ?? filename,
      })
      return "shared"
    } catch (e: unknown) {
      const isAbort = e instanceof Error && e.name === "AbortError"
      if (isAbort) return "shared"
      console.warn("Web Share failed; falling back to file download", e)
    }
  }

  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
  return "downloaded"
}
