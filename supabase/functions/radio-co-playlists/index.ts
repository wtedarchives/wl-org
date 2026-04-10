import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const STATION_ID = "s3c11c85d6"
const STUDIO_PLAYLISTS_URL = `https://studio.radio.co/api/v1/stations/${STATION_ID}/playlists`

/** Accept either secret name (CLI typo / docs drift). */
function getRadioStudioToken(): string | undefined {
  const a = Deno.env.get("RADIO_CO_STUDIO_BEARER_TOKEN")?.trim()
  if (a) return a
  const b = Deno.env.get("RADIO_CO_STUDIO_TOKEN")?.trim()
  if (b) return b
  return undefined
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders })
    }

    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const authHeader = req.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim()
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim()
    const radioToken = getRadioStudioToken()

    const missing: string[] = []
    if (!supabaseUrl) missing.push("SUPABASE_URL")
    if (!supabaseAnonKey) missing.push("SUPABASE_ANON_KEY")
    if (!radioToken) {
      missing.push(
        "RADIO_CO_STUDIO_BEARER_TOKEN (or RADIO_CO_STUDIO_TOKEN)",
      )
    }

    if (missing.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          missing_env: missing,
          hint:
            "supabase secrets set RADIO_CO_STUDIO_BEARER_TOKEN=<Radio.co Studio JWT> && supabase functions deploy radio-co-playlists",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: userData, error: userError } = await userClient.auth.getUser(
      token,
    )
    const user = userData?.user ?? null
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    /** Same access pattern as client `use-admin-status` (user reads own row under RLS). */
    const { data: roleRow, error: roleError } = await userClient
      .from("user_roles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()

    if (roleError || !roleRow?.is_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const res = await fetch(STUDIO_PLAYLISTS_URL, {
      headers: {
        Authorization: `Bearer ${radioToken}`,
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      const body = await res.text()
      return new Response(
        JSON.stringify({
          error: `Radio.co studio returned ${res.status}`,
          detail: body.slice(0, 500),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    let json: { playlists?: unknown }
    try {
      json = (await res.json()) as { playlists?: unknown }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON from Radio.co studio" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    if (!Array.isArray(json.playlists)) {
      return new Response(
        JSON.stringify({
          error: "Invalid Radio.co response: missing playlists",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    return new Response(JSON.stringify({ playlists: json.playlists }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return new Response(
      JSON.stringify({
        error: "Unhandled function error",
        message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
