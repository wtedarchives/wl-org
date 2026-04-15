/** HTML from CMS passes through; plain text is escaped and newlines become `<br />`. */
export function wtedEpisodeDescriptionHtml(raw: string): string {
  const t = raw.trim()
  if (!t) return ""
  if (/<[a-zA-Z][\s\S]*>/.test(t)) return t
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />")
}
