"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type WlHomeV2AuthQuerySyncProps = {
  onOpenLogin: () => void
  onOpenSignup: () => void
  onOpenForgotPassword: () => void
}

/** Opens auth modals from legacy bookmark URLs (`/?signin=1`, etc.) and strips the query. */
export function WlHomeV2AuthQuerySync({
  onOpenLogin,
  onOpenSignup,
  onOpenForgotPassword,
}: WlHomeV2AuthQuerySyncProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const signin = searchParams.get("signin") === "1"
    const signup = searchParams.get("signup") === "1"
    const forgot = searchParams.get("forgot") === "1"
    if (!signin && !signup && !forgot) return

    const params = new URLSearchParams(searchParams.toString())
    params.delete("signin")
    params.delete("signup")
    params.delete("forgot")
    const query = params.toString()
    const url = query ? `${pathname}?${query}` : pathname || "/"
    router.replace(url, { scroll: false })

    if (signin) onOpenLogin()
    else if (signup) onOpenSignup()
    else if (forgot) onOpenForgotPassword()
  }, [
    searchParams,
    pathname,
    router,
    onOpenLogin,
    onOpenSignup,
    onOpenForgotPassword,
  ])

  return null
}
