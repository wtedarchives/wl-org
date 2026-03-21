import { ProfilePlaceholderClient } from "./profile-placeholder-client"

export async function generateStaticParams() {
  return [{ id: "placeholder" }]
}

export default function ProfilePlaceholderPage() {
  return <ProfilePlaceholderClient />
}
