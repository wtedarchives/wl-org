export type EchoPicksStatus = {
  countdown: string
  picksOpen: boolean
}

/** Picks close one hour before showtime (Eastern). */
export function deriveEchoPicksStatus(showTime: string): EchoPicksStatus {
  if (!showTime) return { countdown: "Picks Open", picksOpen: true }

  const showDateTime = new Date(showTime)
  if (Number.isNaN(showDateTime.getTime())) {
    return { countdown: "Picks Open", picksOpen: true }
  }

  const closeAt = new Date(showDateTime.getTime() - 60 * 60 * 1000)
  const timeDiff = closeAt.getTime() - Date.now()
  if (timeDiff <= 0) return { countdown: "Picks Closed", picksOpen: false }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(
    (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  )
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

  let countdown = `${seconds}s`
  if (days > 0) countdown = `${days}d ${hours}h ${minutes}m`
  else if (hours > 0) countdown = `${hours}h ${minutes}m ${seconds}s`
  else if (minutes > 0) countdown = `${minutes}m ${seconds}s`

  return { countdown, picksOpen: true }
}
