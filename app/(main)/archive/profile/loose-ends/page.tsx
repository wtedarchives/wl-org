"use client"

import { useAuth } from "@/components/auth-context"
import { LooseEndsContent } from "@/components/dpro/profile/loose-ends-content"

export default function ProfileLooseEndsPage() {
  const { user } = useAuth()

  return (
    <LooseEndsContent userId={user?.id ?? null} isOwnProfile />
  )
}
