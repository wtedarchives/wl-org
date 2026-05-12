export function getSongSelectionDialogTitle(
  viewMode: boolean,
  isEditing: boolean,
  show_scored?: boolean,
): string {
  if (viewMode) {
    return show_scored ? "Setlist Game Results" : "Your Setlist Picks"
  }
  return isEditing ? "Edit Setlist Picks" : "Select Setlist"
}
