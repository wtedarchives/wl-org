"use client"

export function EchoPicksStarter({
  canFill,
  onFill,
}: {
  canFill: boolean
  onFill: () => void
}) {
  return (
    <section className="echo-picks__starter">
      <div className="echo-of-a-show__stat-label echo-picks__starter-kicker">
        First time? Start here
      </div>
      <p>
        Most Goose shows run two sets and an encore. Aim for a dozen you&apos;re
        confident in — you&apos;re not penalized for picking fewer.
      </p>
      {canFill ?
        <>
          <button
            type="button"
            className="echo-picks__starter-btn"
            onClick={onFill}
          >
            Start from the crowd&apos;s top 12
          </button>
          <p className="echo-picks__starter-note">
            Fills two sets and an encore. Change anything you like.
          </p>
        </>
      : <p className="echo-picks__starter-note">
          The field hasn&apos;t picked enough songs yet — start from a blank
          setlist.
        </p>}
    </section>
  )
}
