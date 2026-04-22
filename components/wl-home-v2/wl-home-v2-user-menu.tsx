"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { supabase } from "@/lib/supabase"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BarChart3Icon, ChevronDown, LogIn, LogOutIcon, User } from "lucide-react"

/**
 * Same account actions as {@link NavUser}; menu styled for the home page (see `.wl-home-v2-user-dropdown`).
 */
export function WlHomeV2UserMenu({
  onOpenLogin,
  onOpenSignup,
}: {
  onOpenLogin: () => void
  onOpenSignup: () => void
}) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [profileUsername, setProfileUsername] = useState<string | null>(null)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !supabase) {
      setProfileUsername(null)
      setProfilePicture(null)
      return
    }
    let cancelled = false
    supabase
      .from("profiles")
      .select("username, profile_picture")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setProfileUsername(null)
          setProfilePicture(null)
          return
        }
        const row = data as { username?: string | null; profile_picture?: string | null }
        setProfileUsername(row.username ?? null)
        const pic =
          typeof row.profile_picture === "string" ? row.profile_picture.trim() : ""
        setProfilePicture(pic || null)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const displayName =
    profileUsername ??
    (user?.email ? user.email.split("@")[0] : "Guest")

  const displayEmail = user?.email ?? "Not signed in"

  const handleSignOut = async () => {
    await signOut()
  }

  const isLoggedIn = Boolean(user)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="top-nav-user-trigger"
          aria-haspopup="menu"
        >
          {isLoggedIn ? (
            <Avatar className="top-nav-user-trigger-avatar">
              <AvatarImage src={profilePicture ?? undefined} alt="" />
              <AvatarFallback className="top-nav-user-trigger-fallback">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : null}
          <span className="top-nav-user-trigger-label">
            {isLoggedIn ? "Profile" : "Log in"}
          </span>
          <ChevronDown className="top-nav-user-chevron" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="wl-home-v2-user-dropdown"
        side="bottom"
        align="center"
        sideOffset={6}
      >
        <DropdownMenuLabel className="top-nav-dd-label p-0 font-normal">
          <div className="flex items-center gap-2.5 px-1 py-2">
            <Avatar className="top-nav-dd-avatar">
              <AvatarImage src={profilePicture ?? undefined} alt="" />
              <AvatarFallback className="top-nav-dd-avatar-fallback">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="top-nav-dd-label-name truncate">
                {displayName}
              </span>
              <span className="top-nav-dd-label-email truncate">
                {displayEmail}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="top-nav-dd-sep" />
        {isLoggedIn ? (
          <>
            <DropdownMenuItem asChild className="top-nav-dd-item">
              <Link
                href="/old/archive/profile/overview"
                className="top-nav-dd-link flex cursor-pointer items-center gap-2"
              >
                <BarChart3Icon className="top-nav-dd-icon size-4 shrink-0" />
                My Stats
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="top-nav-dd-sep" />
            <DropdownMenuItem
              className="top-nav-dd-item"
              onClick={() => {
                void handleSignOut()
                router.push("/")
              }}
            >
              <LogOutIcon className="top-nav-dd-icon size-4 shrink-0" />
              Sign Out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem
              className="top-nav-dd-item flex cursor-pointer items-center gap-2"
              onClick={() => onOpenLogin()}
            >
              <LogIn className="top-nav-dd-icon size-4 shrink-0" />
              Sign In
            </DropdownMenuItem>
            <DropdownMenuItem
              className="top-nav-dd-item flex cursor-pointer items-center gap-2"
              onClick={() => onOpenSignup()}
            >
              <User className="top-nav-dd-icon size-4 shrink-0" />
              Create account
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
