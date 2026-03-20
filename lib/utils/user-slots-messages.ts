export function getSlotsLoadingMessage(
  isOwnProfile: boolean,
  username?: string | null
): string {
  if (isOwnProfile) {
    return "Loading slots data…"
  }
  return `Loading ${username ? `${username}'s` : "their"} slots data…`
}

export function getSlotsNoUserMessage(isOwnProfile: boolean): string {
  if (isOwnProfile) {
    return "Please log in to view your slots."
  }
  return "User data not available."
}

export function getSlotsNoShowsMessage(
  isOwnProfile: boolean,
  username?: string | null
): string {
  if (isOwnProfile) {
    return "You haven't marked any shows as attended yet."
  }
  if (username) {
    return `${username} hasn't marked any shows as attended yet.`
  }
  return "This user hasn't marked any shows as attended yet."
}

export function getSlotsNoSlotsMessage(
  isOwnProfile: boolean,
  username?: string | null
): string {
  if (isOwnProfile) {
    return "No slots data found for your attended shows."
  }
  if (username) {
    return `No slots data found for ${username}'s attended shows.`
  }
  return "No slots data found for this user's attended shows."
}
