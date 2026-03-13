import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Community Forum",
}

export default function ForumPage() {
  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col overflow-hidden md:rounded-b-xl">
      <iframe
        src="https://community.wysterialane.org/"
        title="WTED.org Community Forum"
        className="min-h-0 flex-1 w-full border-0"
        loading="lazy"
      />
    </div>
  )
}

