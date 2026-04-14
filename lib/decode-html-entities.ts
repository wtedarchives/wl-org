/** Decode a small HTML string from Discourse (e.g. fancy_title) for plain-text display. */
export function decodeHtmlEntitiesForDisplay(text: string): string {
  if (typeof document === "undefined") return text
  const el = document.createElement("div")
  el.innerHTML = text
  return el.textContent ?? text
}
