"use client"

import {
  createContext,
  useContext,
  type ReactNode,
} from "react"

import type { SetlistGameArchiveUrlShell } from "@/lib/setlist-game-archive-url"

const SetlistGameArchiveUrlShellContext =
  createContext<SetlistGameArchiveUrlShell>("v2")

export function SetlistGameArchiveUrlShellProvider({
  shell,
  children,
}: {
  shell: SetlistGameArchiveUrlShell
  children: ReactNode
}) {
  return (
    <SetlistGameArchiveUrlShellContext.Provider value={shell}>
      {children}
    </SetlistGameArchiveUrlShellContext.Provider>
  )
}

export function useSetlistGameArchiveUrlShell(): SetlistGameArchiveUrlShell {
  return useContext(SetlistGameArchiveUrlShellContext)
}
