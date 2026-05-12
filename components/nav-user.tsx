"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { ADMIN_SUB } from "@/components/app-sidebar.constants"
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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAdminStatus } from "@/hooks/use-admin-status"
import {
  BarChart3Icon,
  Bug,
  LayoutDashboard,
  LogIn,
  LogOutIcon,
  Radio as RadioIcon,
  Search,
  User,
} from "lucide-react"

function AdminNavIcon({ title }: { title: (typeof ADMIN_SUB)[number]["title"] }) {
  switch (title) {
    case "Admin Panel":
      return <LayoutDashboard className="size-4 shrink-0" />
    case "Radio":
      return <RadioIcon className="size-4 shrink-0" />
    case "Bugs":
      return <Bug className="size-4 shrink-0" />
    default:
      return null
  }
}

export function NavUser({
  onAdminFindClick,
  openBugCount = null,
}: {
  /** Opens the shared {@link FindDialog} from the parent sidebar shell. */
  onAdminFindClick?: () => void
  /** Open bug count for the Bugs row badge (from {@link useBugCount} in the parent). */
  openBugCount?: number | null
} = {}) {
  const { session, signOut } = useAuth()
  const { isAdmin } = useAdminStatus(session)
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const [profileUsername, setProfileUsername] = useState<string | null>(null)

  useEffect(() => {
    if (!session || !supabase) {
      setProfileUsername(null)
      return
    }
    let cancelled = false
    supabase
      .from("profiles")
      .select("username")
      .eq("id", session?.profileId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setProfileUsername(null)
          return
        }
        setProfileUsername(data?.username ?? null)
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

  const loginHref = `/login?from=${encodeURIComponent(pathname || "/")}`

  const isLoggedIn = Boolean(session)

  // Profile avatar + name + email at bottom; clicking opens menu
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="bg-wl-black/40 text-wl-white hover:bg-wl-black/60 ring-0 ring-offset-0 outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src="" alt={displayName} />
                <AvatarFallback className="rounded-full">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-wl-white">
                  {displayEmail}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg ring-zinc-800"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="" alt={displayName} />
                  <AvatarFallback className="rounded-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {displayEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <>
                    {ADMIN_SUB.map((item) => (
                      <DropdownMenuItem key={item.title} asChild>
                        <Link
                          href={item.url}
                          className="flex min-w-0 items-center gap-2"
                        >
                          <AdminNavIcon title={item.title} />
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
                    {onAdminFindClick && (
                      <DropdownMenuItem
                        onClick={() => onAdminFindClick()}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Search className="size-4 shrink-0" />
                        Find
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link
                    href="/old/archive/profile/overview"
                    className="flex items-center gap-2"
                  >
                    <BarChart3Icon className="size-4" />
                    My Stats
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void handleSignOut()
                    router.push("/")
                  }}
                >
                  <LogOutIcon className="size-4" />
                  Sign Out
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link href={loginHref} className="flex items-center gap-2">
                    <LogIn className="size-4" />
                    Sign In
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/signup" className="flex items-center gap-2">
                    <User className="size-4" />
                    Create account
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

