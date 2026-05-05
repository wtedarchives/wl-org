/** If instrument starts/ends with brackets, return as-is; otherwise optionally wrap in parentheses. */
export function formatInstrument(
  inst: string,
  options?: { wrapInParens?: boolean },
): string {
  const t = inst.trim()
  if (t.startsWith("[") || t.endsWith("]")) return inst
  if (options?.wrapInParens === false) {
    return t.startsWith("(") && t.endsWith(")") ? t.slice(1, -1).trim() : t
  }
  return `(${inst})`
}
