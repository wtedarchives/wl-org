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

import {
  hasSilentAttempted,
  isSilentSsoSuppressed,
  markLogoutFlow,
  markSilentAttempted,
  clearSilentAttempted,
  redirectToLogin,
  suppressSilentSsoBriefly,
} from "@/lib/sso"
import { isDevAuthMockSessionActive } from "@/lib/dev-auth-mock"
import {
  getSession,
  clearSession,
  type WysteriaSession,
} from "@/lib/jwt"
import { invokeUserAttendance } from "@/lib/user-attendance-edge"

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

  // On mount — read JWT from localStorage; attempt silent SSO if unauthenticated
  useEffect(() => {
    const existing = getSession()
    if (existing) {
      setSession(existing)
      setLoading(false)
      return
    }

    const { pathname, search } = window.location
    if (pathname.startsWith("/auth/")) {
      setLoading(false)
      return
    }

    if (isDevAuthMockSessionActive()) {
      setLoading(false)
      return
    }

    // Brief window after logout — avoid immediate silent re-login bounce.
    if (isSilentSsoSuppressed()) {
      setLoading(false)
      return
    }

    if (hasSilentAttempted()) {
      setLoading(false)
      return
    }

    markSilentAttempted()
    console.log("[Auth] Silent SSO check initiated")
    const returnTo = `${pathname}${search}`
    void redirectToLogin(returnTo, { promptNone: true })
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

  // Same-tab session updates (e.g. dev mock auth bar)
  useEffect(() => {
    const sync = () => setSession(getSession())
    window.addEventListener("wl-session-updated", sync)
    return () => window.removeEventListener("wl-session-updated", sync)
  }, [])

  // ─── Auth Actions ────────────────────────────────────────────────────────────

  const signIn = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`
    void redirectToLogin(returnTo)
  }

  const signUp = () => {
    // Same SSO redirect as signIn — WLC handles the signup/login branching
    const returnTo = `${window.location.pathname}${window.location.search}`
    void redirectToLogin(returnTo)
  }

  const signOut = () => {
    console.log("[Auth] Sign out — clearing WLC session")
    markLogoutFlow()
    // Don't permanently block silent SSO — only suppress the immediate bounce-back.
    clearSilentAttempted()
    suppressSilentSsoBriefly()
    clearSession()
    setSession(null)
    void redirectToLogin("/", { logout: true })
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
  // Service-role edge function (Wysteria JWT); anon client + RLS use auth.uid().

  const addAttendedShow = async (showId: string) => {
    if (!session?.token) throw new Error("User must be logged in")
    await invokeUserAttendance(session.token, "add", showId)
  }

  const removeAttendedShow = async (showId: string) => {
    if (!session?.token) throw new Error("User must be logged in")
    await invokeUserAttendance(session.token, "remove", showId)
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