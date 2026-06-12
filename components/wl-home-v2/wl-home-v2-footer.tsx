import Link from "next/link"

export function WlHomeV2Footer() {
  return (
    <footer className="foot">
      <span className="foot-copy">
        © 2026 WTEDRADIO.COM · NON-COMMERCIAL FAN SITE ·{" "}
        <Link href="/privacy" className="foot-link">
          Privacy
        </Link>
      </span>
      <span className="foot-tagline">BUILT BY FANS, FOR FANS</span>
    </footer>
  )
}
