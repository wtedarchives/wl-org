export function getUserGuestsMessages(
  isOwnProfile: boolean,
  username: string | null,
  error?: string | null
) {
  const getLoadingMessage = () => {
    if (isOwnProfile) {
      return "Loading personnel data…"
    }
    return `Loading ${username ? `${username}'s` : "their"} personnel data…`
  }

  const getErrorMessage = () => {
    if (isOwnProfile) {
      return error ?? "Failed to load personnel data"
    }
    if (username) {
      return `Failed to load ${username}'s personnel data`
    }
    return "Failed to load personnel data"
  }

  const getEmptyStateMessage = () => {
    return "Add shows to your attended list to see personnel."
  }

  return {
    getLoadingMessage,
    getErrorMessage,
    getEmptyStateMessage,
  }
}
