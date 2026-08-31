/**
 * Who may open `/radio/scheduleimg` and call the schedule renderer.
 *
 * Read by both the Next page (to decide whether to show the menu entry and the
 * page) and the Netlify function (which enforces it), so the two can never
 * drift. Admins always qualify; this list is for everyone else.
 */
export const SCHEDULE_SHARE_IMAGE_ALLOWED_PROFILE_IDS: readonly string[] = [
  "c678a53e-3383-4109-a30c-ee14667095d2",
]

/** Admin, or an explicitly allowlisted profile. */
export function maySeeScheduleShareImage(
  isAdmin: boolean,
  profileId: string | null | undefined,
): boolean {
  if (isAdmin) return true
  return (
    !!profileId && SCHEDULE_SHARE_IMAGE_ALLOWED_PROFILE_IDS.includes(profileId)
  )
}
