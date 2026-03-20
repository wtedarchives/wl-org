"use client"

import { useAuth } from "@/components/auth-context"
import { UserSlots } from "@/components/dpro/profile/user-slots"

export default function ProfileSlotsPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const effectiveUserId = userId
  const isOwnProfile = true

  return (
    <UserSlots
      userId={userId}
      effectiveUserId={effectiveUserId}
      isOwnProfile={isOwnProfile}
    />
  )
}
