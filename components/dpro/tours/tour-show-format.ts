/** `YYYY-MM-DD` → `MM.DD.YY` for compact tour/show tables */
export function formatTourShowDate(showDate: string) {
  const [year, month, day] = showDate.split("-")
  return `${month}.${day}.${year.slice(2)}`
}
