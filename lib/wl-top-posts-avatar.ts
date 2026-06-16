/** Default avatar when Discourse has no custom profile picture. */
export const WL_TOP_POSTS_DEFAULT_AVATAR = "/WL.png"

export function resolveWlTopPostAvatarUrl(
  avatarUrl: string | null | undefined,
): string {
  const trimmed = avatarUrl?.trim() ?? ""
  if (!trimmed) return WL_TOP_POSTS_DEFAULT_AVATAR
  if (/letter_avatar_proxy/i.test(trimmed)) return WL_TOP_POSTS_DEFAULT_AVATAR
  return trimmed
}
