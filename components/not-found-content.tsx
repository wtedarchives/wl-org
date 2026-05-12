import Image from "next/image"
import Link from "next/link"

export function NotFoundContent() {
  return (
    <div className="wl-home-v2-not-found">
      <section
        className="wl-home-v2-not-found__section"
        aria-labelledby="wl-home-v2-not-found-heading"
      >
        <div className="widget-panel wl-home-v2-not-found__panel">
          <Image
            src="/404.png"
            alt=""
            width={800}
            height={450}
            className="wl-home-v2-not-found__art"
          />
          <h1
            id="wl-home-v2-not-found-heading"
            className="wl-home-v2-not-found__title"
          >
            Did the wrung come loose?!
          </h1>
          <p className="wl-home-v2-not-found__body">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
          <Link href="/" className="wbtn primary wl-home-v2-not-found__cta">
            Go to home
          </Link>
        </div>
      </section>
    </div>
  )
}
