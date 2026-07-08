const RADIO_CO_STUDIO_ORIGIN = "https://studio.radio.co"

type RadioCoLoginResponse = {
  error?: string
  message?: string
}

function parseSetCookieHeader(raw: string | null): string {
  if (!raw) return ""
  return raw
    .split(/,(?=\s*[\w-]+=)/)
    .map((part) => part.split(";")[0]?.trim() ?? "")
    .filter(Boolean)
    .join("; ")
}

function cookieHeaderFromResponse(res: Response): string {
  const setCookies = typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : []
  if (setCookies.length > 0) {
    return setCookies.map((cookie) => cookie.split(";")[0]?.trim() ?? "").filter(Boolean).join("; ")
  }
  return parseSetCookieHeader(res.headers.get("set-cookie"))
}

async function parseLoginResponse(res: Response): Promise<RadioCoLoginResponse> {
  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) return {}
  try {
    return (await res.json()) as RadioCoLoginResponse
  } catch {
    return {}
  }
}

/** Obtain a Radio.co Studio session cookie string for authenticated API calls. */
export async function getRadioCoSessionCookie(): Promise<string> {
  const email = Deno.env.get("RADIO_CO_EMAIL")?.trim()
  const password = Deno.env.get("RADIO_CO_PASSWORD")?.trim()
  if (!email || !password) {
    throw new Error("Missing RADIO_CO_EMAIL or RADIO_CO_PASSWORD")
  }

  const loginRes = await fetch(`${RADIO_CO_STUDIO_ORIGIN}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password, _remember_me: true }),
  })

  if (loginRes.status === 429) {
    throw new Error("Radio.co login rate limit hit — try again later")
  }

  const body = await parseLoginResponse(loginRes)
  if (body.error === "2fa.challenge") {
    throw new Error(
      "Radio.co account requires 2FA; Studio API login from edge functions cannot complete 2FA",
    )
  }

  const cookieHeader = cookieHeaderFromResponse(loginRes)
  if (body.error || !loginRes.ok) {
    const detail = body.error ?? body.message ?? `status ${loginRes.status}`
    throw new Error(`Radio.co login failed (${detail})`)
  }

  if (!cookieHeader) {
    throw new Error(`Radio.co login succeeded but no session cookies were returned (status ${loginRes.status})`)
  }

  return cookieHeader
}

export const RADIO_CO_STUDIO_API_V1 = `${RADIO_CO_STUDIO_ORIGIN}/api/v1`
