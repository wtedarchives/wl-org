"use client"

import { createContext, useCallback, useContext } from "react"

import { useAuth } from "@/components/auth-context"

export type WlHomeV2AuthModals = {
  openLogin: () => void
  openSignup: () => void
  openForgotPassword: () => void
}

export const WlHomeV2AuthModalsContext =
  createContext<WlHomeV2AuthModals | null>(null)

export function useWlHomeV2AuthModals() {
  return useContext(WlHomeV2AuthModalsContext)
}

/** Opens the WL Home v2 sign-in modal (same as My Show Stats / header Sign In). */
export function useWlHomeV2OpenLogin() {
  return useWlHomeV2AuthModals()?.openLogin ?? null
}

/** Prefer v2 login modal; fall back to WLC SSO redirect when outside the shell. */
export function useWlHomeV2LoginAction() {
  const authModals = useWlHomeV2AuthModals()
  const { signIn } = useAuth()
  return useCallback(() => {
    if (authModals?.openLogin) authModals.openLogin()
    else signIn()
  }, [authModals, signIn])
}

/** Prefer v2 signup modal; fall back to WLC SSO redirect when outside the shell. */
export function useWlHomeV2SignupAction() {
  const authModals = useWlHomeV2AuthModals()
  const { signUp } = useAuth()
  return useCallback(() => {
    if (authModals?.openSignup) authModals.openSignup()
    else signUp()
  }, [authModals, signUp])
}
