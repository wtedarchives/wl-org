"use client"

import type { ReactNode } from "react"

import { X, ChevronUp, ChevronDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SongPick, SetlistEntry } from "./types"
import { getPlacementBarPillColors } from "@/lib/placement-bar-color"
import { TourShowsStatPill } from "@/components/dpro/tours/tour-shows-stat-pill"
import {
  getSetDisplayName,
  getUniqueSets,
  getAllUniqueSets,
  getSongsForSet,
  getSongsForActualSet,
} from "./utils"
import { TooltipContainer } from "./tooltip-container"
import { ToggleSwitch } from "./toggle-switch"

function PlacementTourPill({
  placement,
  className,
  children,
}: {
  placement: string | undefined
  className?: string
  children: ReactNode
}) {
  const { fill, border } = getPlacementBarPillColors(placement)
  return (
    <TourShowsStatPill fill={fill} border={border} className={className}>
      {children}
    </TourShowsStatPill>
  )
}

interface SetlistDisplayProps {
  songPicks: SongPick[];
  actualSetlist: SetlistEntry[];
  showActualSetlist: boolean;
  setShowActualSetlist: (show: boolean) => void;
  viewMode: boolean;
  show_scored?: boolean;
  isSelectionClosed?: boolean;
  onRemoveSong: (index: number) => void;
  onMoveSongUp: (pickId: string) => void;
  onMoveSongDown: (pickId: string) => void;
  onRemoveSet: (setId: string) => void;
}

export function SetlistDisplay({
  songPicks,
  actualSetlist,
  showActualSetlist,
  setShowActualSetlist,
  viewMode,
  show_scored,
  isSelectionClosed,
  onRemoveSong,
  onMoveSongUp,
  onMoveSongDown,
  onRemoveSet,
}: SetlistDisplayProps) {
  // Use getAllUniqueSets when in view mode for scored shows to show all sets
  // Otherwise use getUniqueSets for regular editing mode
  const uniqueSets = (viewMode && show_scored) 
    ? getAllUniqueSets(songPicks, actualSetlist)
    : getUniqueSets(songPicks);

  if (songPicks.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-center text-sm">
        No songs selected yet. Add songs above to begin.
      </div>
    )
  }

  if (viewMode && show_scored) {
    return (
      <>
        {/* Mobile view: Toggle switch */}
        <div className="md:hidden">
          <ToggleSwitch 
            showActualSetlist={showActualSetlist}
            setShowActualSetlist={setShowActualSetlist}
          />
        </div>
        
        {/* Desktop view: Two column layout */}
        <div className="hidden md:block">
          {uniqueSets.map(setId => (
            <div key={setId} className="border border-border overflow-hidden mb-2">
              <div className="flex items-center px-2 py-1 bg-black">
                <h4 className="text-sm font-medium text-white flex-1">
                  {setId.startsWith('E') ? 
                    `${setId === 'E1' ? 'Encore' : setId === 'E2' ? '2nd Encore' : '3rd Encore'} Selections` : 
                    `Set ${setId} Selections`}
                </h4>
                <h4 className="text-sm font-medium text-white flex-1 pl-6">
                  {setId.startsWith('E') ? 
                    `Actual ${setId === 'E1' ? 'Encore' : setId === 'E2' ? '2nd Encore' : '3rd Encore'}` : 
                    `Actual Set ${setId}`}
                </h4>
              </div>
              
              <div className="p-2 bg-muted/30">
                <div className="grid grid-cols-2 gap-0">
                  {/* Left column: User's selections */}
                  <div className="space-y-0.5 pr-3 border-r border-border">
                    {getSongsForSet(songPicks, setId).length > 0 ? (
                      getSongsForSet(songPicks, setId).map((pick, index) => (
                        <div 
                          key={pick.id} 
                          className="flex justify-between items-center rounded-md text-foreground hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <PlacementTourPill
                              placement={pick.placement}
                              className="flex items-center justify-center min-w-[1.25rem] text-center text-xs"
                            >
                              {index + 1}
                            </PlacementTourPill>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="break-words pr-2 font-medium text-xs text-foreground">
                                {pick.song}
                              </span>
                            </div>
                          </div>
                          
                          {/* Score display in the middle */}
                          <div className="flex items-center shrink-0">
                            {(pick.result !== undefined || pick.score !== undefined) && (
                              <TooltipContainer result={pick.result} score={pick.score ?? 0} pick={pick} />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-foreground text-xs font-medium">
                        No songs picked for this set
                      </div>
                    )}
                  </div>
                  
                  {/* Right column: Actual setlist */}
                  <div className="space-y-0.5 pl-3">
                    {getSongsForActualSet(actualSetlist, setId).length > 0 ? (
                      getSongsForActualSet(actualSetlist, setId).map((entry, index) => (
                        <div 
                          key={entry.entry_id} 
                          className="flex items-center rounded-md text-foreground hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <PlacementTourPill
                              placement={entry.entry_placement}
                              className="flex items-center justify-center min-w-[1.25rem] text-center text-xs"
                            >
                              {index + 1}
                            </PlacementTourPill>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="break-words pr-2 font-medium text-xs text-foreground">
                                {entry.entry_song}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-foreground text-xs font-medium">
                        No songs played in this set
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile view: Single column based on toggle state */}
        <div className="md:hidden">
          {uniqueSets.map(setId => (
            <div key={setId} className="border border-border overflow-hidden mb-2">
              <div className="flex items-center px-2 py-1 bg-black">
                <h4 className="text-sm font-medium text-white flex-1">
                  {setId.startsWith('E') ? 
                    `${getSetDisplayName(setId)} ${!showActualSetlist ? 'Selections' : ''}` : 
                    `Set ${setId} ${!showActualSetlist ? 'Selections' : ''}`}
                </h4>
              </div>
              
              <div className="p-2 bg-muted/30">
                {!showActualSetlist ? (
                  // Show user picks
                  <div className="space-y-0.5">
                    {getSongsForSet(songPicks, setId).length > 0 ? (
                      getSongsForSet(songPicks, setId).map((pick, index) => (
                        <div 
                          key={pick.id} 
                          className="flex justify-between items-center rounded-md text-foreground hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <PlacementTourPill
                              placement={pick.placement}
                              className="flex items-center justify-center min-w-[1.25rem] text-center text-xs"
                            >
                              {index + 1}
                            </PlacementTourPill>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="break-words pr-2 font-medium text-xs text-foreground">
                                {pick.song}
                              </span>
                            </div>
                          </div>
                          
                          {/* Score display */}
                          <div className="flex items-center shrink-0">
                            {(pick.result !== undefined || pick.score !== undefined) && (
                              <TooltipContainer result={pick.result} score={pick.score ?? 0} pick={pick} />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-foreground text-xs font-medium">
                        No songs picked for this set
                      </div>
                    )}
                  </div>
                ) : (
                  // Show actual setlist
                  <div className="space-y-0.5">
                    {getSongsForActualSet(actualSetlist, setId).length > 0 ? (
                      getSongsForActualSet(actualSetlist, setId).map((entry, index) => (
                        <div 
                          key={entry.entry_id} 
                          className="flex items-center rounded-md text-foreground hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <PlacementTourPill
                              placement={entry.entry_placement}
                              className="flex items-center justify-center min-w-[1.25rem] text-center text-xs"
                            >
                              {index + 1}
                            </PlacementTourPill>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="break-words pr-2 font-medium text-xs text-foreground">
                                {entry.entry_song}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-foreground text-xs font-medium">
                        No songs in this set
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Regular view for non-scored or edit mode
  return (
    <div>
      {uniqueSets.map(setId => (
        <div key={setId} className="border border-border overflow-hidden mb-2">
          <div className="flex justify-between items-center px-0.5 py-0.5 bg-muted">
            <h4 className="text-sm pl-1.5 font-medium text-white">
              {getSetDisplayName(setId)}
            </h4>
            {!viewMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSet(setId);
                }}
                className="bg-red-600 text-white hover:bg-red-600/80 p-1 rounded"
                title="Remove this set"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="space-y-0.5 py-1 px-2 bg-muted/30">
            {getSongsForSet(songPicks, setId).map((pick, index) => (
              <div 
                key={pick.id} 
                className="flex justify-between items-center rounded-md text-foreground hover:bg-muted/40 transition-all duration-200 ease-out">
                <div className="flex items-center gap-3">
                  <PlacementTourPill
                    placement={pick.placement}
                    className="flex items-center font-medium justify-center min-w-[1.5rem] text-xs"
                  >
                    {index + 1}
                  </PlacementTourPill>
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="break-words font-medium text-xs">
                      {pick.song}
                    </span>
                    {/* Only show placement labels if not in view mode or if the show isn't closed */}
                    {pick.placement && (!viewMode || !isSelectionClosed) && 
                     !pick.placement.startsWith('Main Set') && (
                      <PlacementTourPill
                        placement={pick.placement}
                        className="!text-[10px] leading-tight shrink-0 inline-block"
                      >
                        {pick.placement}
                      </PlacementTourPill>
                    )}
                  </div>
                </div>
                
                {!viewMode ? (
                  <div className="flex items-center shrink-0 ml-2">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        onMoveSongUp(pick.id);
                      }}
                      className="text-foreground bg-muted hover:bg-muted/40 p-0.5 mr-0.5 rounded border border-border"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        onMoveSongDown(pick.id);
                      }}
                      className="text-foreground bg-muted hover:bg-muted/40 p-0.5 mr-0.5 rounded border border-border"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        const index = songPicks.findIndex(p => p.id === pick.id);
                        if (index !== -1) {
                          onRemoveSong(index);
                        }
                      }}
                      className="text-white bg-red-600 hover:bg-red-600/50 p-0.5 mr-0.5 rounded border border-border"
                      title="Remove song"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center shrink-0 ml-2">
                    {/* Only show + indicators for scored shows */}
                    {show_scored && (pick.result !== undefined || pick.score !== undefined) && (
                      <TooltipContainer result={pick.result} score={pick.score ?? 0} pick={pick} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
