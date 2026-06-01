"use client"

import { useCallback, useEffect, useState } from "react"

import { invokeUserProfilePreferences } from "@/lib/user-profile-preferences-edge"
import {
  getPushSupportState,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  type PushSupportState,
} from "@/lib/push-notifications"
import { supabase } from "@/lib/supabase"

export function usePushNotificationsPreference(
  profileId: string | undefined,
  accessToken: string | undefined,
) {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [loading, setLoading] = useState(Boolean(profileId))
  const [saving, setSaving] = useState(false)
  const [supportState, setSupportState] = useState<PushSupportState>("unsupported")

  useEffect(() => {
    setSupportState(getPushSupportState())
  }, [])

  useEffect(() => {
    if (!profileId || !supabase) {
      setPushEnabled(false)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from("profiles")
      .select("push_notifications_enabled")
      .eq("id", profileId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setPushEnabled(false)
        } else {
          const row = data as { push_notifications_enabled?: boolean | null }
          setPushEnabled(row.push_notifications_enabled === true)
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [profileId])

  const savePushEnabled = useCallback(
    async (next: boolean): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!profileId || !accessToken) {
        return { ok: false, error: "Sign in to manage notifications." }
      }

      setSaving(true)
      try {
        if (next) {
          const subscribed = await subscribeToWebPush()
          if (!subscribed.ok) {
            return { ok: false, error: subscribed.error }
          }
          const result = await invokeUserProfilePreferences(accessToken, {
            push_notifications_enabled: true,
            push_subscription: subscribed.subscription,
          })
          if (!result.ok) return result
          setPushEnabled(true)
          return { ok: true }
        }

        await unsubscribeFromWebPush()
        const result = await invokeUserProfilePreferences(accessToken, {
          push_notifications_enabled: false,
        })
        if (!result.ok) return result
        setPushEnabled(false)
        return { ok: true }
      } finally {
        setSaving(false)
      }
    },
    [profileId, accessToken],
  )

  return {
    pushEnabled,
    savePushEnabled,
    loading,
    saving,
    supportState,
  }
}
