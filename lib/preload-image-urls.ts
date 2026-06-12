/** Warm the browser image cache (client only). Resolves when each URL loads or errors. */
export function preloadImageUrls(
  urls: Iterable<string | null | undefined>,
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()

  const unique = [
    ...new Set(
      [...urls]
        .map((u) => u?.trim() ?? "")
        .filter((u) => u.length > 0),
    ),
  ]
  if (unique.length === 0) return Promise.resolve()

  return Promise.all(
    unique.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          const finish = () => resolve()
          img.onload = finish
          img.onerror = finish
          img.src = src
        }),
    ),
  ).then(() => undefined)
}
