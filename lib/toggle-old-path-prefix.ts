/** Insert or strip a leading `/old` segment so you can mirror routes while redesigning. */
export function toggleOldPathPrefix(pathname: string): string {
  /** Venue detail is only `/archive/venue?id=`; `/old/archive/venue` redirects there (Netlify + client). */
  if (pathname === "/old/archive/venue" || pathname === "/archive/venue") {
    return "/archive/venue"
  }
  if (pathname === "/old" || pathname.startsWith("/old/")) {
    if (pathname === "/old") return "/"
    const rest = pathname.slice("/old".length)
    return !rest || rest === "/" ? "/" : rest
  }
  if (pathname === "/") return "/old"
  return `/old${pathname}`
}
