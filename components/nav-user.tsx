"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
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
import { BarChart3Icon, LogIn, LogOutIcon, User } from "lucide-react"

export function NavUser() {
  const { session, signOut } = useAuth()
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

