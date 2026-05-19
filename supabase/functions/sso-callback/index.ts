// supabase/functions/sso-callback/index.ts
//
// WYSTERIA LANE — SSO Callback Edge Function
//
// Handles the DiscourseConnect handshake between WLC and the site.
// Called by the frontend callback route after WLC redirects back.
//
// Flow:
//   1. Frontend receives sso + sig params from WLC redirect
//   2. Frontend calls this Edge Function with those params
//   3. This function validates the signature
//   4. Looks up or creates/links the profile
//   5. Ensures a user_roles row exists (is_admin = false when new)
//   6. Issues a custom JWT
//   7. Returns the JWT to the frontend

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts"
import { corsHeaders } from "../_shared/cors.ts"

const WLC_SSO_SECRET = Deno.env.get("WLC_SSO_SECRET") ?? ""
const WYSTERIA_JWT_SECRET = Deno.env.get("WYSTERIA_JWT_SECRET") ?? ""
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

const JWT_EXPIRY_SECONDS = 60 * 60 * 24 * 7

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

async function validateSignature(payload: string, sig: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(WLC_SSO_SECRET)
  const payloadData = encoder.encode(payload)

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, payloadData)
  const expectedSig = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return expectedSig === sig
}

function decodeSSOPayload(sso: string): Record<string, string> {
  const decoded = atob(sso)
  const params = new URLSearchParams(decoded)
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
}

async function issueJWT(payload: {
  profileId: string
  discourseUserId: number
  username: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  isAdmin: boolean
}): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(WYSTERIA_JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )

  return await create(
    { alg: "HS256", typ: "JWT" },
    {
      profile_id: payload.profileId,
      discourse_user_id: payload.discourseUserId,
      username: payload.username,
      email: payload.email,
      display_name: payload.displayName,
      avatar_url: payload.avatarUrl,
      is_admin: payload.isAdmin,
      exp: getNumericDate(JWT_EXPIRY_SECONDS),
      iat: getNumericDate(0),
    },
    key,
  )
}

async function checkIsAdmin(profileId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("is_admin")
    .eq("id", profileId)
    .maybeSingle()
  return data?.is_admin === true
}

/** Insert user_roles for WLC users when missing; never downgrade existing admins. */
async function ensureUserRole(profileId: string): Promise<void> {
  const { data: existing } = await supabase
    .from("user_roles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle()

  if (existing) return

  const { error } = await supabase.from("user_roles").insert({
    id: profileId,
    is_admin: false,
  })

  if (error) {
    if (error.code === "23505") return
    throw new Error(`Failed to ensure user role: ${error.message}`)
  }
}

async function resolveProfile(wlcUser: {
  discourseUserId: number
  email: string
  username: string
  name: string | null
  avatarUrl: string | null
}): Promise<{
  profileId: string
  isAdmin: boolean
  isNew: boolean
}> {
  let profileId: string
  let isNew: boolean

  const { data: byDiscourseId } = await supabase
    .from("profiles")
    .select("id")
    .eq("discourse_user_id", wlcUser.discourseUserId)
    .maybeSingle()

  if (byDiscourseId) {
    profileId = byDiscourseId.id
    isNew = false
    await supabase
      .from("profiles")
      .update({
        username: wlcUser.username,
        email: wlcUser.email,
        display_name: wlcUser.name,
        profile_picture: wlcUser.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId)
  } else {
    const { data: byEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", wlcUser.email)
      .maybeSingle()

    if (byEmail) {
      profileId = byEmail.id
      isNew = false
      await supabase
        .from("profiles")
        .update({
          discourse_user_id: wlcUser.discourseUserId,
          username: wlcUser.username,
          display_name: wlcUser.name,
          profile_picture: wlcUser.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId)
    } else {
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          discourse_user_id: wlcUser.discourseUserId,
          username: wlcUser.username,
          email: wlcUser.email,
          display_name: wlcUser.name,
          profile_picture: wlcUser.avatarUrl,
        })
        .select("id")
        .single()

      if (insertError || !newProfile) {
        throw new Error(`Failed to create profile: ${insertError?.message}`)
      }

      profileId = newProfile.id
      isNew = true
    }
  }

  await ensureUserRole(profileId)
  const isAdmin = await checkIsAdmin(profileId)
  return { profileId, isAdmin, isNew }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  try {
    const body = await req.json()
    const { sso, sig } = body

    if (!sso || !sig) {
      return jsonResponse({ error: "Missing sso or sig parameter" }, 400)
    }

    const isValid = await validateSignature(sso, sig)
    if (!isValid) {
      console.error("SSO signature validation failed")
      return jsonResponse({ error: "Invalid SSO signature" }, 403)
    }

    const payload = decodeSSOPayload(sso)
    console.log("SSO payload decoded for:", payload.email)

    const discourseUserId = parseInt(payload.external_id, 10)
    if (!discourseUserId || !payload.email) {
      return jsonResponse(
        { error: "Invalid SSO payload — missing external_id or email" },
        400,
      )
    }

    const { profileId, isAdmin, isNew } = await resolveProfile({
      discourseUserId,
      email: payload.email,
      username: payload.username ?? payload.email.split("@")[0],
      name: payload.name ?? null,
      avatarUrl: payload.avatar_url ?? null,
    })

    console.log(`Profile resolved: ${profileId} (isNew: ${isNew}, isAdmin: ${isAdmin})`)

    const jwt = await issueJWT({
      profileId,
      discourseUserId,
      username: payload.username ?? "",
      email: payload.email,
      displayName: payload.name ?? null,
      avatarUrl: payload.avatar_url ?? null,
      isAdmin,
    })

    return jsonResponse(
      {
        token: jwt,
        profile_id: profileId,
        is_new: isNew,
        is_admin: isAdmin,
      },
      200,
    )
  } catch (err) {
    console.error("SSO callback error:", err)
    return jsonResponse({ error: "Internal server error" }, 500)
  }
})
