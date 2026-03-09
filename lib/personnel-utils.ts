/** If instrument starts/ends with brackets, return as-is; otherwise wrap in parentheses. */
export function formatInstrument(
  inst: string,
  options?: { wrapInParens?: boolean },
): string {
  const t = inst.trim()
  if (t.startsWith("[") || t.endsWith("]")) return inst
  if (options?.wrapInParens === false) return t
  return `(${inst})`
}
