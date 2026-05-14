import { redirect } from "next/navigation"

export default function ProfilePage() {
  redirect("/archive/profile?tab=overview")
}
