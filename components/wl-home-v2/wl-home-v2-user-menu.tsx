"use client"

import { redirectToLogin } from "@/lib/sso"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ADMIN_SUB } from "@/components/app-sidebar.constants"
import { FindDialog } from "@/components/dpro/admin/find-dialog"
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
import { useAdminStatus } from "@/hooks/use-admin-status"
import { useWlHomeV2OpenSettings } from "@/components/wl-home-v2/wl-home-v2-open-settings-context"
import { useBugCount } from "@/hooks/use-bug-count"
import {
  Broadcast,
  Bug,
  CaretDown,
  ChartBarHorizontal,
  Export,
  GearSix,
  MagnifyingGlass,
  SignIn,
  SignOut,
  SlidersHorizontal,
  User,
} from "@phosphor-icons/react"

function WlHomeV2AdminNavIcon({
  title,
}: {
  title: (typeof ADMIN_SUB)[number]["title"]
}) {
  const cls = "top-nav-dd-icon size-4 shrink-0"
  switch (title) {
    case "Admin Panel":
      return <GearSix className={cls} aria-hidden />
    case "Radio":
      return <Broadcast className={cls} aria-hidden />
    case "Bugs":
      return <Bug className={cls} aria-hidden />
    default:
      return null
  }
}

/**
 * Same account actions as the former sidebar user menu; styled for the home page.
 */
export function WlHomeV2UserMenu({
  onOpenLogin,
  onOpenSignup,
  onOpenShareSchedule,
  onOpenSettings,
}: {
  onOpenLogin: () => void
  onOpenSignup: () => void
  /** Admin-only: opens schedule image export modal. */
  onOpenShareSchedule?: () => void
  /** Signed-in: opens account settings modal. */
  onOpenSettings?: () => void
}) {
  const { session, signOut } = useAuth()
  const openSettingsFromContext = useWlHomeV2OpenSettings()
  const openSettings = onOpenSettings ?? openSettingsFromContext ?? undefined
  const { isAdmin } = useAdminStatus(session)
  const openBugCount = useBugCount()
  const router = useRouter()
  const [profileUsername, setProfileUsername] = useState<string | null>(null)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [findDialogOpen, setFindDialogOpen] = useState(false)

  useEffect(() => {
    if (!session || !supabase) {
      setProfileUsername(null)
      setProfilePicture(null)
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
  }, [session?.profileId])

  const displayName =
    profileUsername ??
    (session?.email ? session?.email.split("@")[0] : "Guest")

  const displayEmail = session?.email ?? "Not signed in"

  const handleSignOut = async () => {
    await signOut()
  }

  const isLoggedIn = Boolean(session)

  /** Avoid Radix ID mismatch across SSR/client (dropdown trigger id differs on hydrate). */
  const [radixReady, setRadixReady] = useState(false)
  useEffect(() => setRadixReady(true), [])

  const trigger = (
    <button
      type="button"
      className="top-nav-user-trigger"
      aria-haspopup="menu"
      aria-label={isLoggedIn ? "Account menu" : "Sign in menu"}
    >
      {isLoggedIn ?
        <Avatar className="top-nav-user-trigger-avatar">
          <AvatarImage src={profilePicture ?? undefined} alt="" />
          <AvatarFallback className="top-nav-user-trigger-fallback">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      : <span className="top-nav-user-trigger-guest" aria-hidden>
          <User className="top-nav-user-trigger-guest-icon" size={18} weight="regular" />
        </span>
      }
      <CaretDown className="top-nav-user-chevron" aria-hidden />
    </button>
  )

  if (!radixReady) return trigger

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
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
              {isAdmin && (
                <>
                  {ADMIN_SUB.map((item) => (
                    <DropdownMenuItem key={item.title} asChild className="top-nav-dd-item">
                      <Link
                        href={item.url}
                        className="top-nav-dd-link flex min-w-0 cursor-pointer items-center gap-2"
                      >
                        <WlHomeV2AdminNavIcon title={item.title} />
                        <span className="min-w-0 flex-1 truncate">
                          {item.title}
                        </span>
                        {item.title === "Bugs" &&
                          openBugCount != null &&
                          openBugCount > 0 && (
                            <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                              {openBugCount > 99 ? "99+" : openBugCount}
                            </span>
                          )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    className="top-nav-dd-item flex cursor-pointer items-center gap-2"
                    onClick={() => setFindDialogOpen(true)}
                  >
                    <MagnifyingGlass
                      className="top-nav-dd-icon size-4 shrink-0"
                      aria-hidden
                    />
                    Find
                  </DropdownMenuItem>
                  {onOpenShareSchedule ?
                    <DropdownMenuItem
                      className="top-nav-dd-item flex cursor-pointer items-center gap-2"
                      onClick={onOpenShareSchedule}
                    >
                      <Export
                        className="top-nav-dd-icon size-4 shrink-0"
                        aria-hidden
                      />
                      Share Schedule
                    </DropdownMenuItem>
                  : null}
                  <DropdownMenuSeparator className="top-nav-dd-sep" />
                </>
              )}
              <DropdownMenuItem asChild className="top-nav-dd-item">
                <Link
                  href="/archive/profile?tab=overview"
                  className="top-nav-dd-link flex cursor-pointer items-center gap-2"
                >
                  <ChartBarHorizontal className="top-nav-dd-icon size-4 shrink-0" />
                  My Show Stats
                </Link>
              </DropdownMenuItem>
              {openSettings ?
                <DropdownMenuItem
                  className="top-nav-dd-item flex cursor-pointer items-center gap-2"
                  onClick={openSettings}
                >
                  <SlidersHorizontal
                    className="top-nav-dd-icon size-4 shrink-0"
                    aria-hidden
                  />
                  Settings
                </DropdownMenuItem>
              : null}
              <DropdownMenuSeparator className="top-nav-dd-sep" />
              <DropdownMenuItem
                className="top-nav-dd-item"
                onClick={() => {
                  void handleSignOut()
                  router.push("/")
                }}
              >
                <SignOut className="top-nav-dd-icon size-4 shrink-0" />
                Sign Out
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem
                className="top-nav-dd-item flex cursor-pointer items-center gap-2"
                onClick={() => void redirectToLogin()}
              >
                <SignIn className="top-nav-dd-icon size-4 shrink-0" />
                Sign In
              </DropdownMenuItem>
              <DropdownMenuItem
                className="top-nav-dd-item flex cursor-pointer items-center gap-2"
                onClick={() => void redirectToLogin()}
              >
                <User className="top-nav-dd-icon size-4 shrink-0" />
                Create account
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {isAdmin && (
        <FindDialog open={findDialogOpen} onOpenChange={setFindDialogOpen} />
      )}
    </>
  )
}
