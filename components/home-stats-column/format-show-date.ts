export function formatShowDate(dateStr: string) {
  return dateStr
    .split("-")
    .slice(1)
    .concat(dateStr.substring(2, 4))
    .join(".")
}
