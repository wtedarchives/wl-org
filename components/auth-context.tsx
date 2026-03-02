"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
    data: { user: User | null; session: Session | null } | null
  }>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
    data: { user: User | null; session: Session | null } | null
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const client = supabase

    const getInitialSession = async () => {
      const {
        data: { session },
      } = await client.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, newSession) => {
      const newUser = newSession?.user ?? null

      setSession((prevSession) => {
        if (prevSession?.access_token !== newSession?.access_token) {
          return newSession
        }
        return prevSession
      })

      setUser((prevUser) => {
        if (prevUser?.id !== newUser?.id) {
          return newUser
        }
        return prevUser
      })

      setLoading((prevLoading) => {
        if (prevLoading) {
          return false
        }
        return prevLoading
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn: AuthContextType["signIn"] = async (email, password) => {
    if (!supabase) {
      return {
        error: new Error("Supabase is not configured"),
        data: null,
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return result
  }

  const signUp: AuthContextType["signUp"] = async (email, password) => {
    if (!supabase) {
      return {
        error: new Error("Supabase is not configured"),
        data: null,
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await supabase.auth.signUp({ email, password })
    return result
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const resetPassword: AuthContextType["resetPassword"] = async (email) => {
    if (!supabase) {
      return { error: new Error("Supabase is not configured") }
    }
    const redirectTo = "https://dripfield.pro/update-password"
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    return { error }
  }

  const updatePassword: AuthContextType["updatePassword"] = async (
    newPassword,
  ) => {
    if (!supabase) {
      return { error: new Error("Supabase is not configured") }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

