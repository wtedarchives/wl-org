import { redirect } from "next/navigation"

/**
 * `/wted/shows` is disabled for end users (see `public/_redirects` on Netlify).
 * The `WtedShows` UI remains in `@/components/wted-shows` and
 * `@/app/(main)/wted/shows/content` for future reuse.
 */
export default function WtedShowsPage() {
  redirect("/wted/program-director")
}
