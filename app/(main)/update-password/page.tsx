"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth-context"

export default function UpdatePasswordPage() {
  const { updatePassword } = useAuth()

  useEffect(() => {
    updatePassword()
  }, [updatePassword])

  return null
}
