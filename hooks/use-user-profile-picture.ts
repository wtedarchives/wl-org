"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-context"
import { supabase } from "@/lib/supabase"

/** Loads `profiles.profile_picture` + `username` for the signed-in user (wl-home tiles, archive hub, etc.). */
export function useUserProfilePicture() {
  const { user } = useAuth()
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(
    null,
  )
  const [profilePhotoLoadFailed, setProfilePhotoLoadFailed] = useState(false)

  useEffect(() => {
    setProfilePhotoLoadFailed(false)
    if (!user || !supabase) {
      setProfilePicture(null)
      setProfileDisplayName(null)
      return
    }
    let cancelled = false
    supabase
      .from("profiles")
      .select("username, profile_picture")
      .eq("id", session?.profileId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setProfilePicture(null)
          setProfileDisplayName(null)
          return
        }
        const row = data as {
          username?: string | null
          profile_picture?: string | null
        }
        setProfileDisplayName(row.username?.trim() || null)
        const raw =
          typeof row.profile_picture === "string" ?
            row.profile_picture.trim()
          : ""
        const pic =
          !raw || raw === "null" || raw === "undefined" ? "" : raw
        setProfilePicture(pic || null)
      })
    return () => {
      cancelled = true
    }
  }, [session?.profileId])

  useEffect(() => {
    setProfilePhotoLoadFailed(false)
  }, [profilePicture])

  const profilePhotoAlt =
    profileDisplayName ?
      `Profile photo for ${profileDisplayName}`
    : session?.email ?
      `Profile photo for ${session?.email.split("@")[0]}`
    : "Your profile photo"

  return {
    user,
    profileSignedIn: Boolean(user),
    profilePicture,
    profileDisplayName,
    profilePhotoLoadFailed,
    setProfilePhotoLoadFailed,
    profilePhotoAlt,
  }
}
