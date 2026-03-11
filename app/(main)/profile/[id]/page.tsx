"use client"

import { useParams } from "next/navigation"

export default function ProfilePlaceholderPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="@container/main flex min-w-0 flex-1 flex-col items-center justify-center gap-4 p-8">
      <p className="text-muted-foreground text-center">
        User profile not available yet.
      </p>
      {id && (
        <p className="text-sm text-muted-foreground/80">
          User ID: <code className="rounded bg-muted px-1 py-0.5">{id}</code>
        </p>
      )}
    </div>
  )
}
