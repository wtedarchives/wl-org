import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

type SetlistEntry = {
  entry_id: string
  entry_song: string
  entry_set: string
  entry_setnum: number
  entry_placement: string
  entry_new: string | null
}

type PickRow = {
  pick_id: string
  song: string
  set: string
  setnum: number
  placement: string | null
}

function calculatePotentialScore(
  pick: { song: string; set: string; setnum: number; placement: string },
  instance: { set: string; setnum: number; placement: string },
  isFirstPick: boolean,
  isLastPick: boolean,
  actualFirstSong: SetlistEntry | null,
  actualLastSong: SetlistEntry | null,
): { score: number; result: string; showopenerBonus: boolean; showcloserBonus: boolean } {
  let pickScore = 0
  let resultString = "not_played"
  let showopenerBonus = false
  let showcloserBonus = false

  pickScore = 2
  resultString = "correct_song"

  const correctSetMatch = pick.set === instance.set
  let setAndPositionMatch = false

  if (correctSetMatch) {
    pickScore = 4
    resultString = "correct_song_set"
    setAndPositionMatch = pick.setnum === instance.setnum
    if (setAndPositionMatch) {
      pickScore = 7
      resultString = "correct_song_set_setnum"
    }
  }

  const userPlacement = pick.placement || ""
  const hasOpener = userPlacement.includes("Opener")
  const hasCloser = userPlacement.includes("Closer")
  const hasEncore = userPlacement.includes("Encore")

  const actualPlacement = instance.placement || ""
  const hasMatchingPlacement =
    (hasOpener && actualPlacement.includes("Opener")) ||
    (hasCloser && actualPlacement.includes("Closer")) ||
    (hasEncore && actualPlacement.includes("Encore"))

  if (hasMatchingPlacement) {
    if (correctSetMatch && instance.set === pick.set) {
      if (setAndPositionMatch && instance.setnum === pick.setnum) {
        pickScore = 10
        resultString = "correct_song_set_setnum_openercloserencore"
      } else {
        pickScore = 7
        resultString = "correct_song_set_openercloserencore"
      }
    } else if (pickScore <= 2) {
      pickScore = 5
      resultString = "correct_song_openercloserencore"
    }
  }

  if (isFirstPick && actualFirstSong) {
    const isShowOpenerMatch =
      (pick.song === "[New Original Song]" &&
        actualFirstSong.entry_new === "New Original Song") ||
      (pick.song === "[New Cover Song]" && actualFirstSong.entry_new === "New Cover Song")

    if (isShowOpenerMatch) {
      showopenerBonus = true
      pickScore += 3
    }
  }

  if (isLastPick && actualLastSong) {
    const isShowCloserMatch =
      (pick.song === "[New Original Song]" &&
        actualLastSong.entry_new === "New Original Song") ||
      (pick.song === "[New Cover Song]" && actualLastSong.entry_new === "New Cover Song")

    if (isShowCloserMatch) {
      showcloserBonus = true
      pickScore += 3
    }
  }

  return { score: pickScore, result: resultString, showopenerBonus, showcloserBonus }
}

function generateCombinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (k > items.length) return []
  if (k === items.length) return [items]

  const combinations: T[][] = []
  for (let i = 0; i <= items.length - k; i++) {
    const head = items[i]
    const tailCombinations = generateCombinations(items.slice(i + 1), k - 1)
    for (const tail of tailCombinations) {
      combinations.push([head, ...tail])
    }
  }
  return combinations
}

function generatePermutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items]
  const permutations: T[][] = []
  for (let i = 0; i < items.length; i++) {
    const head = items[i]
    const tail = items.slice(0, i).concat(items.slice(i + 1))
    const tailPermutations = generatePermutations(tail)
    for (const tailPerm of tailPermutations) {
      permutations.push([head, ...tailPerm])
    }
  }
  return permutations
}

function findOptimalMatching(
  picks: Array<{ pick: PickRow; index: number }>,
  instances: Array<{ set: string; setnum: number; placement: string }>,
  actualFirstSong: SetlistEntry | null,
  actualLastSong: SetlistEntry | null,
  allPicksSorted: PickRow[],
): { matchedPicks: Set<number>; assignments: Map<number, number> } {
  if (instances.length === 0 || picks.length === 0) {
    return { matchedPicks: new Set(), assignments: new Map() }
  }

  const scoreMatrix: Array<
    Array<{ score: number; result: string; showopenerBonus: boolean; showcloserBonus: boolean }>
  > = []

  picks.forEach((pickWrapper) => {
    const pick = pickWrapper.pick
    const isFirstPick = allPicksSorted[0]?.pick_id === pick.pick_id
    const isLastPick = allPicksSorted[allPicksSorted.length - 1]?.pick_id === pick.pick_id
    const row: Array<{
      score: number
      result: string
      showopenerBonus: boolean
      showcloserBonus: boolean
    }> = []
    instances.forEach((instance) => {
      row.push(
        calculatePotentialScore(
          { ...pick, placement: pick.placement ?? "" },
          instance,
          isFirstPick,
          isLastPick,
          actualFirstSong,
          actualLastSong,
        ),
      )
    })
    scoreMatrix.push(row)
  })

  if (picks.length <= instances.length) {
    const instanceIndices = instances.map((_, idx) => idx)
    const permutations = generatePermutations(instanceIndices.slice(0, picks.length))

    let bestTotalScore = -1
    let bestAssignments: Map<number, number> = new Map()

    for (const permutation of permutations) {
      let totalScore = 0
      const assignments = new Map<number, number>()
      for (let i = 0; i < picks.length; i++) {
        const pickIdx = picks[i].index
        const instanceIdx = permutation[i]
        totalScore += scoreMatrix[i][instanceIdx].score
        assignments.set(pickIdx, instanceIdx)
      }
      if (totalScore > bestTotalScore) {
        bestTotalScore = totalScore
        bestAssignments = assignments
      }
    }

    return { matchedPicks: new Set(picks.map((p) => p.index)), assignments: bestAssignments }
  }

  const combinations = generateCombinations(
    picks.map((_, idx) => idx),
    instances.length,
  )

  let bestTotalScore = -1
  let bestCombination: number[] = []
  let bestAssignments: Map<number, number> = new Map()

  for (const combination of combinations) {
    const selectedPicks = combination.map((idx) => picks[idx])
    const instanceIndices = instances.map((_, idx) => idx)
    const permutations = generatePermutations(instanceIndices)

    for (const permutation of permutations) {
      let totalScore = 0
      const assignments = new Map<number, number>()
      for (let i = 0; i < selectedPicks.length; i++) {
        const pickIdx = selectedPicks[i].index
        const instanceIdx = permutation[i]
        totalScore += scoreMatrix[combination[i]][instanceIdx].score
        assignments.set(pickIdx, instanceIdx)
      }
      if (totalScore > bestTotalScore) {
        bestTotalScore = totalScore
        bestCombination = combination
        bestAssignments = assignments
      }
    }
  }

  return {
    matchedPicks: new Set(bestCombination.map((idx) => picks[idx].index)),
    assignments: bestAssignments,
  }
}

export type ScoreSetlistGameMode = "final" | "provisional"

export async function scoreSetlistGameShow(
  db: SupabaseClient,
  showId: string,
  mode: ScoreSetlistGameMode = "final",
): Promise<{ error?: string }> {
  if (mode === "provisional") {
    const { data: showRow, error: showErr } = await db
      .from("shows")
      .select("show_scored")
      .eq("show_id", showId)
      .single()
    if (showErr) return { error: showErr.message }
    if (showRow?.show_scored) {
      return { error: "Show is already scored" }
    }
  }
  const { data: setlistData, error: setlistError } = await db
    .from("setlist_entries")
    .select("entry_id")
    .eq("entry_show", showId)

  if (setlistError) {
    return { error: `Failed to fetch setlist: ${setlistError.message}` }
  }

  const totalSongsPlayed = setlistData?.length ?? 0

  const { data: actualSetlistData, error: actualSetlistError } = await db
    .from("setlist_entries")
    .select("entry_id, entry_song, entry_set, entry_setnum, entry_placement, entry_new")
    .eq("entry_show", showId)
    .order("entry_set", { ascending: true })
    .order("entry_setnum", { ascending: true })

  if (actualSetlistError) {
    return { error: actualSetlistError.message }
  }

  const setlistEntries = (actualSetlistData ?? []) as SetlistEntry[]
  const actualLastSong =
    setlistEntries.length > 0 ? setlistEntries[setlistEntries.length - 1] : null
  const closerSong = mode === "provisional" ? null : actualLastSong

  const { data: submissionsData, error: submissionsError } = await db
    .from("setlist_game_submissions")
    .select("submission_id, user_id, total_songs_picked")
    .eq("show_id", showId)

  if (submissionsError) {
    return { error: submissionsError.message }
  }

  for (const submission of submissionsData ?? []) {
    let totalScore = 0

    const { error: totalPlayedErr } = await db
      .from("setlist_game_submissions")
      .update({ total_songs_played: totalSongsPlayed })
      .eq("submission_id", submission.submission_id)

    if (totalPlayedErr) return { error: totalPlayedErr.message }

    const { data: picksData, error: picksError } = await db
      .from("setlist_game_picks")
      .select("pick_id, song, set, setnum, placement")
      .eq("submission_id", submission.submission_id)

    if (picksError) return { error: picksError.message }

    const picks = (picksData ?? []) as PickRow[]
    const sortedPicks = [...picks].sort((a, b) => {
      const setCompare = a.set.localeCompare(b.set)
      if (setCompare !== 0) return setCompare
      return a.setnum - b.setnum
    })

    const setlistSongs: Record<
      string,
      Array<{ set: string; setnum: number; placement: string }>
    > = {}
    const setlistNewSongs: Record<
      string,
      Array<{ set: string; setnum: number; placement: string }>
    > = {
      "New Original Song": [],
      "New Cover Song": [],
    }

    setlistEntries.forEach((entry) => {
      if (!setlistSongs[entry.entry_song]) {
        setlistSongs[entry.entry_song] = []
      }
      setlistSongs[entry.entry_song].push({
        set: entry.entry_set,
        setnum: entry.entry_setnum,
        placement: entry.entry_placement,
      })

      if (entry.entry_new === "New Original Song" || entry.entry_new === "New Cover Song") {
        setlistNewSongs[entry.entry_new].push({
          set: entry.entry_set,
          setnum: entry.entry_setnum,
          placement: entry.entry_placement,
        })
      }
    })

    const regularPicks: PickRow[] = []
    const newOriginalPicks: Array<{ pick: PickRow; index: number }> = []
    const newCoverPicks: Array<{ pick: PickRow; index: number }> = []

    picks.forEach((pick, index) => {
      if (pick.song === "[New Original Song]") {
        newOriginalPicks.push({ pick, index })
      } else if (pick.song === "[New Cover Song]") {
        newCoverPicks.push({ pick, index })
      } else {
        regularPicks.push(pick)
      }
    })

    for (const pick of regularPicks) {
      let pickScore = 0
      let resultString = "not_played"
      const songInstances = setlistSongs[pick.song] || []

      if (songInstances.length > 0) {
        pickScore = 2
        resultString = "correct_song"

        const correctSetMatch = songInstances.some((instance) => pick.set === instance.set)
        let setAndPositionMatch = false

        if (correctSetMatch) {
          pickScore = 4
          resultString = "correct_song_set"
          setAndPositionMatch = songInstances.some(
            (instance) => pick.set === instance.set && pick.setnum === instance.setnum,
          )
          if (setAndPositionMatch) {
            pickScore = 7
            resultString = "correct_song_set_setnum"
          }
        }

        const userPlacement = pick.placement || ""
        const hasOpener = userPlacement.includes("Opener")
        const hasCloser = userPlacement.includes("Closer")
        const hasEncore = userPlacement.includes("Encore")

        const matchingPlacementInstance = songInstances.find((instance) => {
          const actualPlacement = instance.placement || ""
          return (
            (hasOpener && actualPlacement.includes("Opener")) ||
            (hasCloser && actualPlacement.includes("Closer")) ||
            (hasEncore && actualPlacement.includes("Encore"))
          )
        })

        if (matchingPlacementInstance) {
          if (correctSetMatch && matchingPlacementInstance.set === pick.set) {
            if (setAndPositionMatch && matchingPlacementInstance.setnum === pick.setnum) {
              pickScore = 10
              resultString = "correct_song_set_setnum_openercloserencore"
            } else {
              pickScore = 7
              resultString = "correct_song_set_openercloserencore"
            }
          } else if (pickScore <= 2) {
            pickScore = 5
            resultString = "correct_song_openercloserencore"
          }
        }
      }

      totalScore += pickScore

      const { error: pickUpdateErr } = await db
        .from("setlist_game_picks")
        .update({ score: pickScore, result: resultString })
        .eq("pick_id", pick.pick_id)

      if (pickUpdateErr) return { error: pickUpdateErr.message }
    }

    const newSongTypes = [
      {
        picks: newOriginalPicks,
        instances: setlistNewSongs["New Original Song"],
      },
      {
        picks: newCoverPicks,
        instances: setlistNewSongs["New Cover Song"],
      },
    ]

    for (const { picks: newPicks, instances } of newSongTypes) {
      if (newPicks.length === 0) continue

      const { matchedPicks, assignments } = findOptimalMatching(
        newPicks,
        instances,
        setlistEntries[0] ?? null,
        closerSong,
        sortedPicks,
      )

      for (const pickWrapper of newPicks) {
        const pick = pickWrapper.pick
        const pickIndex = pickWrapper.index
        const isMatched = matchedPicks.has(pickIndex)

        if (isMatched) {
          const instanceIdx = assignments.get(pickIndex)
          if (instanceIdx === undefined || instanceIdx >= instances.length) {
            const { error: fallbackErr } = await db
              .from("setlist_game_picks")
              .update({
                score: 0,
                result: "not_played",
                showopener_correct: false,
                showcloser_correct: false,
              })
              .eq("pick_id", pick.pick_id)
            if (fallbackErr) return { error: fallbackErr.message }
            continue
          }

          const instance = instances[instanceIdx]
          const isFirstPick = sortedPicks[0]?.pick_id === pick.pick_id
          const isLastPick = sortedPicks[sortedPicks.length - 1]?.pick_id === pick.pick_id

          const potential = calculatePotentialScore(
            { ...pick, placement: pick.placement ?? "" },
            instance,
            isFirstPick,
            isLastPick,
            setlistEntries[0] ?? null,
            closerSong,
          )

          totalScore += potential.score

          const { error: newPickErr } = await db
            .from("setlist_game_picks")
            .update({
              score: potential.score,
              result: potential.result,
              showopener_correct: potential.showopenerBonus,
              showcloser_correct: potential.showcloserBonus,
            })
            .eq("pick_id", pick.pick_id)

          if (newPickErr) return { error: newPickErr.message }
        } else {
          const { error: unmatchedErr } = await db
            .from("setlist_game_picks")
            .update({
              score: 0,
              result: "not_played",
              showopener_correct: false,
              showcloser_correct: false,
            })
            .eq("pick_id", pick.pick_id)

          if (unmatchedErr) return { error: unmatchedErr.message }
        }
      }
    }

    if (sortedPicks.length > 0 && setlistEntries.length > 0) {
      const firstPick = sortedPicks[0]
      const lastPick = sortedPicks[sortedPicks.length - 1]
      const actualFirstSong = setlistEntries[0]

      if (
        firstPick.song !== "[New Original Song]" &&
        firstPick.song !== "[New Cover Song]"
      ) {
        const isShowOpenerCorrect = firstPick.song === actualFirstSong.entry_song
        if (isShowOpenerCorrect) {
          const { data: currentPickData, error: readErr } = await db
            .from("setlist_game_picks")
            .select("score")
            .eq("pick_id", firstPick.pick_id)
            .single()

          if (readErr) return { error: readErr.message }

          const currentPickScore = currentPickData?.score || 0
          const showopenerBonus = 3
          const newPickScore = currentPickScore + showopenerBonus
          totalScore += showopenerBonus

          const { error: openerErr } = await db
            .from("setlist_game_picks")
            .update({ score: newPickScore, showopener_correct: true })
            .eq("pick_id", firstPick.pick_id)

          if (openerErr) return { error: openerErr.message }
        }
      }

      if (
        mode !== "provisional" &&
        actualLastSong &&
        lastPick.song !== "[New Original Song]" &&
        lastPick.song !== "[New Cover Song]"
      ) {
        const isShowCloserCorrect = lastPick.song === actualLastSong.entry_song
        if (isShowCloserCorrect) {
          const { data: currentPickData, error: readErr } = await db
            .from("setlist_game_picks")
            .select("score")
            .eq("pick_id", lastPick.pick_id)
            .single()

          if (readErr) return { error: readErr.message }

          const currentPickScore = currentPickData?.score || 0
          const showcloserBonus = 3
          const newPickScore = currentPickScore + showcloserBonus
          totalScore += showcloserBonus

          const { error: closerErr } = await db
            .from("setlist_game_picks")
            .update({ score: newPickScore, showcloser_correct: true })
            .eq("pick_id", lastPick.pick_id)

          if (closerErr) return { error: closerErr.message }
        }
      }
    }

    if (
      mode !== "provisional" &&
      submission.total_songs_picked > totalSongsPlayed
    ) {
      const excessSongs = submission.total_songs_picked - totalSongsPlayed
      totalScore -= excessSongs * 3
    }

    const { error: submissionErr } = await db
      .from("setlist_game_submissions")
      .update(
        mode === "provisional"
          ? { score_provisional: totalScore }
          : { score: totalScore },
      )
      .eq("submission_id", submission.submission_id)

    if (submissionErr) return { error: submissionErr.message }
  }

  if (mode !== "provisional") {
    const { error: updateError } = await db
      .from("shows")
      .update({ show_scored: true })
      .eq("show_id", showId)

    if (updateError) {
      return { error: updateError.message }
    }
  }

  return {}
}
