"use client"

import { useAuth } from "@/components/auth-context"
import { UserPersonnel } from "@/components/dpro/profile/user-personnel"

export default function ProfilePersonnelPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const effectiveUserId = userId
  const isOwnProfile = true

  return (
    <UserPersonnel
      userId={userId}
      effectiveUserId={effectiveUserId}
      isOwnProfile={isOwnProfile}
    />
  )
}
