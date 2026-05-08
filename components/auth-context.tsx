"use client"

// components/auth-context.tsx
//
// WYSTERIA LANE — Auth Context (SSO Rewrite)
// Replaces Supabase Auth with custom JWT session issued by the
// sso-callback Edge Function after WLC DiscourseConnect authentication.
//
// BREAKING CHANGES FROM OLD VERSION:
//   - user: User | null          → removed
//   - session: Session | null    → replaced with session: WysteriaSession | null
//   - signIn(email, password)    → signIn() — no params, initiates SSO redirect
//   - signUp(email, password)    → signUp() — no params, initiates SSO redirect
//   - resetPassword(email)       → resetPassword() — redirects to WLC forgot password
//   - updatePassword(password)   → updatePassword() — redirects to WLC account prefs
//
// CALL SITE CHANGES NEEDED ACROSS CODEBASE:
//   session?.profileId                → session?.profileId
//   session?.email             → session?.email
//   session?.token   → session?.token
//   session?.profileId               → session?.profileId
//   session?.email            → session?.email

import React, { createContext, useContext, useEffect, useState } from "react"

import { redirectToLogin } from "@/lib/sso"
import {
  getSession,
  clearSession,
  type WysteriaSession,
} from "@/lib/jwt"
import { supabase } from "@/lib/supabase"

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthContextType = {
  session: WysteriaSession | null
  loading: boolean
  isAdmin: boolean
  signIn: () => void
  signUp: () => void
  signOut: () => void
  resetPassword: () => void
  updatePassword: () => void
  addAttendedShow: (showId: string) => Promise<void>
  removeAttendedShow: (showId: string) => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<WysteriaSession | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount — read JWT from localStorage
  useEffect(() => {
    const existing = getSession()
    setSession(existing)
    setLoading(false)
  }, [])

  // Watch for storage events so logout in one tab propagates to others
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "wl_session") {
        if (!e.newValue) {
          // Token was cleared in another tab — log out here too
          setSession(null)
        } else {
          // Token was set in another tab (e.g. after SSO callback)
          const updated = getSession()
          setSession(updated)
        }
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  // ─── Auth Actions ────────────────────────────────────────────────────────────

  const signIn = () => {
    void redirectToLogin(window.location.pathname)
  }

  const signUp = () => {
    // Same SSO redirect as signIn — WLC handles the signup/login branching
    void redirectToLogin(window.location.pathname)
  }

  const signOut = () => {
    clearSession()
    setSession(null)
    // Optionally also log out of WLC to fully clear their session
    // window.location.href = "https://community.wysterialane.org/logout"
    window.location.href = "/"
  }

  const WLC_FORGOT_PASSWORD =
    "https://community.wysterialane.org/session/forgot_password"
  const WLC_ACCOUNT_PREFS =
    "https://community.wysterialane.org/my/preferences/account"

  const resetPassword = () => {
    // Password reset is handled by WLC (same tab so the auth flow stays one window)
    window.location.assign(WLC_FORGOT_PASSWORD)
  }

  const updatePassword = () => {
    // Password/profile changes handled by WLC
    window.location.assign(WLC_ACCOUNT_PREFS)
  }

  // ─── Attendance Actions ───────────────────────────────────────────────────────
  // These write directly to DPRO using the profile UUID from the JWT.

  const addAttendedShow = async (showId: string) => {
    if (!supabase || !session) throw new Error("User must be logged in")
    const { error } = await supabase
      .from("user_attended_shows")
      .insert({ user_id: session.profileId, show_id: showId })
    if (error) throw error
  }

  const removeAttendedShow = async (showId: string) => {
    if (!supabase || !session) throw new Error("User must be logged in")
    const { error } = await supabase
      .from("user_attended_shows")
      .delete()
      .eq("user_id", session.profileId)
      .eq("show_id", showId)
    if (error) throw error
  }

  // ─── Context Value ────────────────────────────────────────────────────────────

  const value: AuthContextType = {
    session,
    loading,
    isAdmin: session?.isAdmin ?? false,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    addAttendedShow,
    removeAttendedShow,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}