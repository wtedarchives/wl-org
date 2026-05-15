import { redirect } from "next/navigation"

/** Legacy path — canonical tab is `badges`. */
export default function ProfileLooseEndsLegacyRedirectPage() {
  redirect("/archive/profile?tab=badges")
}
