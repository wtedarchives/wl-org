"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type {
  TopSong,
  ShowOpener,
  SetOpener,
  SetCloser,
  Encore,
  NotPlayedSong,
  LongestSong,
  LiberatedSong,
  ShowStat,
} from "@/lib/types/stats"
import {
  fetchTopSongsData,
  fetchShowOpenersData,
  fetchSetOpenersData,
  fetchSetClosersData,
  fetchEncoresData,
  fetchLongestSongsData,
  fetchLiberatedSongsData,
} from "@/lib/stats/stats-data-utils"
import { fetchShowStatsData } from "@/lib/stats/show-stats-utils"
import { fetchStatsSongSpreadShows } from "@/lib/stats/fetch-stats-song-spread-shows"
import type { TourSongSpreadShowInput } from "@/lib/stats/tour-song-spread-compute"

export function useStatsData(selectedYear: number | string) {
  const [topSongs, setTopSongs] = useState<TopSong[]>([])
  const [showOpeners, setShowOpeners] = useState<ShowOpener[]>([])
  const [setOpeners, setSetOpeners] = useState<SetOpener[]>([])
  const [setClosers, setSetClosers] = useState<SetCloser[]>([])
  const [encores, setEncores] = useState<Encore[]>([])
  const [notPlayedSongs, setNotPlayedSongs] = useState<NotPlayedSong[]>([])
  const [longestSongs, setLongestSongs] = useState<LongestSong[]>([])
  const [liberatedSongs, setLiberatedSongs] = useState<LiberatedSong[]>([])
  const [longestShows, setLongestShows] = useState<ShowStat[]>([])
  const [lowestRarityShows, setLowestRarityShows] = useState<ShowStat[]>([])
  const [highestGapShows, setHighestGapShows] = useState<ShowStat[]>([])
  const [highestAttendedShows, setHighestAttendedShows] = useState<ShowStat[]>([])
  const [highestRatedShows, setHighestRatedShows] = useState<ShowStat[]>([])
  const [songSpreadShows, setSongSpreadShows] = useState<
    TourSongSpreadShowInput[]
  >([])

  const [loadingTopSongs, setLoadingTopSongs] = useState(true)
  const [loadingShowOpeners, setLoadingShowOpeners] = useState(true)
  const [loadingSetOpeners, setLoadingSetOpeners] = useState(true)
  const [loadingSetClosers, setLoadingSetClosers] = useState(true)
  const [loadingEncores, setLoadingEncores] = useState(true)
  const [loadingNotPlayed, setLoadingNotPlayed] = useState(true)
  const [loadingLongestSongs, setLoadingLongestSongs] = useState(true)
  const [loadingLiberatedSongs, setLoadingLiberatedSongs] = useState(true)
  const [loadingShowStats, setLoadingShowStats] = useState(true)
  const [loadingSongSpread, setLoadingSongSpread] = useState(true)

  useEffect(() => {
    setLoadingTopSongs(true)
    setLoadingShowOpeners(true)
    setLoadingSetOpeners(true)
    setLoadingSetClosers(true)
    setLoadingEncores(true)
    if (selectedYear !== "all-time") {
      setLoadingNotPlayed(true)
    }
    setLoadingLongestSongs(true)
    setLoadingLiberatedSongs(true)
    setLoadingShowStats(true)
    setLoadingSongSpread(true)

    const fetchNotPlayed = async () => {
      if (selectedYear === "all-time") {
        setNotPlayedSongs([])
        setLoadingNotPlayed(false)
        return
      }
      if (!supabase) {
        setLoadingNotPlayed(false)
        return
      }
      try {
        const { data, error } = await supabase.rpc(
          "get_most_common_not_played_songs",
          { selected_year: selectedYear }
        )
        if (error) throw error
        setNotPlayedSongs((data || []).slice(0, 10))
      } catch {
        setNotPlayedSongs([])
      } finally {
        setLoadingNotPlayed(false)
      }
    }

    Promise.all([
      fetchTopSongsData(selectedYear).then((d) => {
        setTopSongs(d)
        setLoadingTopSongs(false)
      }).catch(() => setLoadingTopSongs(false)),
      fetchShowOpenersData(selectedYear).then((d) => {
        setShowOpeners(d)
        setLoadingShowOpeners(false)
      }).catch(() => setLoadingShowOpeners(false)),
      fetchSetOpenersData(selectedYear).then((d) => {
        setSetOpeners(d)
        setLoadingSetOpeners(false)
      }).catch(() => setLoadingSetOpeners(false)),
      fetchSetClosersData(selectedYear).then((d) => {
        setSetClosers(d)
        setLoadingSetClosers(false)
      }).catch(() => setLoadingSetClosers(false)),
      fetchEncoresData(selectedYear).then((d) => {
        setEncores(d)
        setLoadingEncores(false)
      }).catch(() => setLoadingEncores(false)),
      fetchNotPlayed(),
      fetchLongestSongsData(selectedYear).then((d) => {
        setLongestSongs(d)
        setLoadingLongestSongs(false)
      }).catch(() => setLoadingLongestSongs(false)),
      fetchLiberatedSongsData(selectedYear).then((d) => {
        setLiberatedSongs(d)
        setLoadingLiberatedSongs(false)
      }).catch(() => setLoadingLiberatedSongs(false)),
      fetchShowStatsData(selectedYear).then((stats) => {
        setLongestShows(stats.longest)
        setLowestRarityShows(stats.lowestRarity)
        setHighestGapShows(stats.highestGap)
        setHighestAttendedShows(stats.highestAttended)
        setHighestRatedShows(stats.highestRated)
        setLoadingShowStats(false)
      }).catch(() => setLoadingShowStats(false)),
      fetchStatsSongSpreadShows(selectedYear).then((shows) => {
        setSongSpreadShows(shows)
        setLoadingSongSpread(false)
      }).catch(() => {
        setSongSpreadShows([])
        setLoadingSongSpread(false)
      }),
    ])
  }, [selectedYear])

  const isAnyStatLoading =
    loadingTopSongs ||
    loadingShowOpeners ||
    loadingSetOpeners ||
    loadingSetClosers ||
    loadingEncores ||
    loadingNotPlayed ||
    loadingLongestSongs ||
    loadingLiberatedSongs ||
    loadingShowStats ||
    loadingSongSpread

  return {
    topSongs,
    showOpeners,
    setOpeners,
    setClosers,
    encores,
    notPlayedSongs,
    longestSongs,
    liberatedSongs,
    longestShows,
    lowestRarityShows,
    highestGapShows,
    highestAttendedShows,
    highestRatedShows,
    songSpreadShows,
    isAnyStatLoading,
  }
}
