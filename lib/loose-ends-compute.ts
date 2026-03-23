import type {
  AttendedShowJoined,
  CategoryProgress,
  GroupedLooseEnds,
  LooseEndDisplay,
  LooseEndRow,
  ShowStatsBundle,
  StandsAttended,
} from "@/types/loose-ends"

export function processSideProjects(
  attendedShowsData: AttendedShowJoined[]
): Record<string, boolean> {
  const sideProjectsAttended: Record<string, boolean> = {}
  const sideProjects = ["Orebolo", "Vasudo", "Great Blue"] as const
  for (const project of sideProjects) {
    sideProjectsAttended[project] = attendedShowsData.some(
      (row) => row.shows?.show_group === project
    )
  }
  return sideProjectsAttended
}

export function buildShowStatsBundle(
  attendedShowsData: AttendedShowJoined[]
): {
  canonicalShows: AttendedShowJoined[]
  bundle: ShowStatsBundle
} {
  const canonicalShows = attendedShowsData.filter(
    (s) => s.shows && s.shows.show_canonid !== null
  )

  const goosemasShowsAttended = new Set<string>()
  const tourCountsMap: Record<string, number> = {}

  for (const item of canonicalShows) {
    const d = item.shows?.show_detail
    if (d && d.includes("Goosemas")) {
      goosemasShowsAttended.add(d)
    }
  }

  for (const item of attendedShowsData) {
    const tour = item.shows?.show_tour
    if (tour) {
      tourCountsMap[tour] = (tourCountsMap[tour] || 0) + 1
    }
  }

  return {
    canonicalShows,
    bundle: {
      canonicalShowCount: canonicalShows.length,
      attendedGlobalShow: false,
      debutCount: 0,
      goosemasShowsAttended,
      tourCountsMap,
    },
  }
}

export function processFiveInARow(
  attendedShowsData: AttendedShowJoined[]
): boolean {
  const canonicalShows = attendedShowsData.filter(
    (s) => s.shows && s.shows.show_canonid !== null
  )

  const showsByTour: Record<
    string,
    { id: string; canonId: number }[]
  > = {}

  for (const item of canonicalShows) {
    const sh = item.shows
    if (!sh?.show_tour || sh.show_canonid == null) continue
    const tourName = sh.show_tour
    if (!showsByTour[tourName]) showsByTour[tourName] = []
    showsByTour[tourName].push({
      id: sh.show_id,
      canonId: sh.show_canonid,
    })
  }

  let fiveInARowCompleted = false
  for (const shows of Object.values(showsByTour)) {
    const sortedShows = [...shows].sort((a, b) => a.canonId - b.canonId)
    let maxConsecutive = 1
    let currentConsecutive = 1
    for (let i = 1; i < sortedShows.length; i++) {
      if (sortedShows[i].canonId === sortedShows[i - 1].canonId + 1) {
        currentConsecutive++
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
      } else {
        currentConsecutive = 1
      }
    }
    if (maxConsecutive >= 5) {
      fiveInARowCompleted = true
      break
    }
  }

  return fiveInARowCompleted
}

export function updateLooseEndsCompletion(
  looseEndsData: LooseEndRow[],
  sideProjectsAttended: Record<string, boolean>,
  showStats: ShowStatsBundle,
  standsAttended: StandsAttended,
  fiveInARowCompleted: boolean,
  progress: CategoryProgress
): LooseEndDisplay[] {
  return looseEndsData.map((looseEnd) => {
    const cat = looseEnd.end_category

    if (cat === "Completionist") {
      const categoryProgressData = progress[looseEnd.end] ?? {
        seen: 0,
        total: 10,
        percentage: 0,
      }
      const isComplete =
        categoryProgressData.seen >= categoryProgressData.total &&
        categoryProgressData.total > 0
      return {
        ...looseEnd,
        isCompleted: isComplete,
        progress: categoryProgressData,
      }
    }

    if (cat === "Side Projects") {
      return {
        ...looseEnd,
        isCompleted: !!sideProjectsAttended[looseEnd.end],
      }
    }

    if (cat === "Song Debuts") {
      let requiredDebuts = 0
      if (looseEnd.end.startsWith("Debut x")) {
        requiredDebuts = parseInt(looseEnd.end.replace("Debut x", ""), 10)
      }
      const isComplete =
        !Number.isNaN(requiredDebuts) && showStats.debutCount >= requiredDebuts
      return { ...looseEnd, isCompleted: isComplete }
    }

    if (cat === "Goosemas") {
      let requiredShows = 0
      if (looseEnd.end.startsWith("Goosemas x")) {
        requiredShows = parseInt(looseEnd.end.replace("Goosemas x", ""), 10)
      }
      const showsAttended = showStats.goosemasShowsAttended.size
      const isComplete =
        !Number.isNaN(requiredShows) && showsAttended >= requiredShows
      return { ...looseEnd, isCompleted: isComplete }
    }

    if (cat === "Tour Stats") {
      let isComplete = false
      if (looseEnd.end === "Tour x5") {
        isComplete = Object.values(showStats.tourCountsMap).some((c) => c >= 5)
      } else if (looseEnd.end === "Tour x10") {
        isComplete = Object.values(showStats.tourCountsMap).some((c) => c >= 10)
      } else if (looseEnd.end === "Five in a Row") {
        isComplete = fiveInARowCompleted
      } else if (looseEnd.end.includes("Night Stand")) {
        isComplete = Object.values(standsAttended).some(
          (stand) => stand.completed && stand.category === looseEnd.end
        )
      }
      return { ...looseEnd, isCompleted: isComplete }
    }

    if (cat === "Show Stats") {
      let isComplete = false
      if (looseEnd.end.startsWith("Goose x")) {
        const requiredShows = parseInt(looseEnd.end.replace("Goose x", ""), 10)
        isComplete =
          !Number.isNaN(requiredShows) &&
          showStats.canonicalShowCount >= requiredShows
      } else if (looseEnd.end === "Goin' Global") {
        isComplete = showStats.attendedGlobalShow
      }
      return { ...looseEnd, isCompleted: isComplete }
    }

    return { ...looseEnd, isCompleted: false }
  })
}

export function groupLooseEndsByCategory(updatedLooseEnds: LooseEndDisplay[]): {
  grouped: GroupedLooseEnds
  categoryList: string[]
} {
  const grouped: GroupedLooseEnds = {}
  const categoryList: string[] = []

  for (const looseEnd of updatedLooseEnds) {
    const category = looseEnd.end_category || "Uncategorized"
    if (!grouped[category]) {
      grouped[category] = []
      categoryList.push(category)
    }
    grouped[category].push(looseEnd)
  }

  return { grouped, categoryList }
}
