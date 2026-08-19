"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { notFound, useSearchParams } from "next/navigation"

import { useAuth } from "@/components/auth-context"
import { EchoOfAShowHome } from "@/components/echo-of-a-show/echo-of-a-show-home"
import { EchoOfAShowRulesDialog } from "@/components/echo-of-a-show/echo-of-a-show-rules-dialog"
import { EchoOfAShowShell } from "@/components/echo-of-a-show/echo-of-a-show-shell"
import { EchoOfAShowShowView } from "@/components/echo-of-a-show/echo-of-a-show-show-view"
import {
  useWlHomeV2LoginAction,
  useWlHomeV2SignupAction,
} from "@/components/wl-home-v2/wl-home-v2-open-login-context"
import { getEchoOfAShowIndexUrl } from "@/lib/echo-of-a-show-url"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function resolveEchoParams(searchParams: ReturnType<typeof useSearchParams>): {
  showId: string
  tourId: string
  invalidParams: boolean
} {
  const ids = searchParams
    .getAll("id")
    .map((s) => s.trim())
    .filter(Boolean)
  const tourIds = searchParams
    .getAll("tour_id")
    .map((s) => s.trim())
    .filter(Boolean)
  if (new Set(ids).size > 1 || new Set(tourIds).size > 1) {
    return { showId: "", tourId: "", invalidParams: true }
  }
  const showId = ids[0] ?? ""
  const tourId = tourIds[0] ?? ""
  if (showId && tourId) {
    return { showId: "", tourId: "", invalidParams: true }
  }
  return { showId, tourId, invalidParams: false }
}

function EchoComingNext({
  crumbLabel,
  copy,
}: {
  crumbLabel: string
  copy: string
}) {
  const { session } = useAuth()
  const openLogin = useWlHomeV2LoginAction()
  const openSignup = useWlHomeV2SignupAction()
  const [showRules, setShowRules] = useState(false)

  return (
    <EchoOfAShowShell
      session={session}
      crumbLabel={crumbLabel}
      onHowToPlay={() => setShowRules(true)}
      onLogin={openLogin}
      onSignup={openSignup}
    >
      <p className="echo-of-a-show__stub">
        {copy}{" "}
        <Link href={getEchoOfAShowIndexUrl()}>Back to Echo of a Show</Link>
      </p>
      <EchoOfAShowRulesDialog open={showRules} onOpenChange={setShowRules} />
    </EchoOfAShowShell>
  )
}

export function EchoOfAShowView() {
  const searchParams = useSearchParams()
  const { showId, tourId, invalidParams } = useMemo(
    () => resolveEchoParams(searchParams),
    [searchParams],
  )

  if (invalidParams) notFound()

  if (tourId) {
    if (!UUID_RE.test(tourId)) notFound()
    return (
      <EchoComingNext
        crumbLabel="Season"
        copy="The season page (standings, shows, numbers) lands in a later pass."
      />
    )
  }

  if (showId) {
    if (!UUID_RE.test(showId)) notFound()
    return <EchoOfAShowShowView showId={showId} />
  }

  return <EchoOfAShowHome />
}
