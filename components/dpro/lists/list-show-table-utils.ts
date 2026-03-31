export function formatListShowTableDate(date: string) {
  const [year, month, day] = date.split("-")
  return `${month}.${day}.${year.slice(2)}`
}
