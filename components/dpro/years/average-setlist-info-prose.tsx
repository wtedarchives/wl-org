export function AverageSetlistInfoProse({
  headingClassName,
  bodyClassName,
}: {
  headingClassName: string
  bodyClassName: string
}) {
  return (
    <>
      <p className={bodyClassName}>
        The Average Setlist is a statistical model built from every canonical
        show in a given year or tour. It&apos;s not a real setlist — it&apos;s a
        representation of what a typical show looked like during that stretch.
      </p>

      <h3 className={headingClassName}>Set inclusion</h3>
      <p className={bodyClassName}>
        A set is only included if it was played in more than 50% of canonical
        shows in the slice that have setlist data (same entry filters as the
        rest of this model). The number of songs per set is the rounded average
        of distinct songs played in that set across all shows that included
        that set.
      </p>

      <h3 className={headingClassName}>Song selection</h3>
      <p className={bodyClassName}>
        Songs are ranked by how many shows they appeared in. The model
        calculates the total slots needed across all included sets and pulls the
        most-played songs to fill them. If multiple songs are tied at the
        cutoff, all tied songs enter the pool and the excess is trimmed after
        scoring.
      </p>

      <h3 className={headingClassName}>Scoring and ordering</h3>
      <p className={bodyClassName}>
        Each appearance is assigned a normalized position score: the song&apos;s
        absolute position in the show divided by the total songs in that show,
        scaled to the longest show in the slice. Per-show scores are averaged to
        produce a single number representing where in the night the song
        typically lives. The full pool is then sorted by this score — lower
        means earlier in the show.
      </p>

      <h3 className={headingClassName}>Trimming ties</h3>
      <p className={bodyClassName}>
        When the pool needs to be trimmed, only the least-played songs are
        eligible for cuts. Among those, songs are cut in this order: highest
        positional standard deviation first (most inconsistent placement), then
        lowest historical rarity percentage, then alphabetical as a last resort.
      </p>

      <h3 className={headingClassName}>What it tells you</h3>
      <p className={bodyClassName}>
        The Average Setlist reflects what the band gravitated toward during a
        given period — which songs were staples, where they typically fell in
        the show, and how the sets were generally structured. It won&apos;t
        match any single real show exactly, but it&apos;s a useful lens for
        understanding the shape of a tour or year.
      </p>
    </>
  )
}
