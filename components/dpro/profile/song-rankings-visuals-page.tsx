"use client"

import Link from "next/link"

import { SongRankingsVisualsRankingsGrid } from "@/components/dpro/profile/song-rankings-visuals-rankings-grid"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2ProfileArchiveShell } from "@/components/wl-home-v2/wl-home-v2-profile-archive-shell"

import "@/components/dpro/profile/profile-stats-tabs-shell.css"
import "@/components/dpro/profile/profile-rankings-tab.css"
import "./song-rankings-visuals-page.css"

import {
  InteractiveCompletePreview,
  InteractiveErrorPreview,
  InteractiveLoadingPreview,
  LiveChromeReference,
  NotStartedPreview,
  ReadonlyCompletedChartPreview,
  ReadonlyEmptyPreview,
  ReadonlyErrorPreview,
  VisualSection,
  VotingPreview,
} from "@/components/dpro/profile/song-rankings-visuals-page-previews"

export function SongRankingsVisualsPage() {
  return (
    <WlHomeV2>
      <WlHomeV2ProfileArchiveShell>
        <div className="rankings-visuals-page">
          <header className="rankings-visuals-page__intro">
            <h1 className="rankings-visuals-page__title">Rankings tab visuals</h1>
            <p className="rankings-visuals-page__lede">
              Ungated review page for every Rankings UI state. Container styling
              matches overview / profile widget panels. Placeholder data only.
            </p>
          </header>

          <div className="rankings-visuals-page__grid">
            <VisualSection
              title="Reference — complete in profile shell"
              description="Same chrome as the live Rankings tab (My Stats header + tabs)."
            >
              <LiveChromeReference />
            </VisualSection>

            <VisualSection
              title="Own profile — loading"
              description="Initial start_session fetch."
            >
              <InteractiveLoadingPreview />
            </VisualSection>

            <VisualSection
              title="Own profile — not started"
              description="No session yet; user must tap Start."
            >
              <NotStartedPreview />
            </VisualSection>

            <VisualSection
              title="Own profile — error"
              description="Edge function or network failure with retry."
            >
              <InteractiveErrorPreview />
            </VisualSection>

            <VisualSection
              title="Own profile — voting (idle)"
              description="In-progress session; category artwork on each card."
            >
              <VotingPreview voting={false} />
            </VisualSection>

            <VisualSection
              title="Own profile — voting (submitting)"
              description="Between submit_vote and the next matchup; progress dots pulse."
            >
              <VotingPreview voting />
            </VisualSection>

            <VisualSection
              title="Own profile — complete"
              description="Session finished; responsive grid and Start Over."
            >
              <InteractiveCompletePreview />
            </VisualSection>

            <VisualSection
              title="Own profile — complete with new songs"
              description="Catalog grew since last ranking; rank new songs or start over."
            >
              <InteractiveCompletePreview withUnranked />
            </VisualSection>

            <VisualSection
              title="Own profile — restarting"
              description="Start Over clicked; button disabled while restart_session runs."
            >
              <InteractiveCompletePreview restarting />
            </VisualSection>

            <VisualSection
              title="Public profile — loading"
              description="Read-only fetch for another user&apos;s completed ranking."
            >
              <InteractiveLoadingPreview />
            </VisualSection>

            <VisualSection
              title="Public profile — error"
              description="Read-only Supabase query failed."
            >
              <ReadonlyErrorPreview />
            </VisualSection>

            <VisualSection
              title="Public profile — no ranking yet"
              description="User has no complete session."
            >
              <ReadonlyEmptyPreview />
            </VisualSection>

            <VisualSection
              title="Public profile — completed chart"
              description="Read-only ranked grid (no Start Over)."
            >
              <ReadonlyCompletedChartPreview />
            </VisualSection>
          </div>

          <p className="rankings-visuals-page__footer-note">
            Tweak styles in{" "}
            <Link href="/rankings-visuals" className="rankings-visuals-page__footer-link">
              song-rankings-visuals-page.css
            </Link>{" "}
            before porting to live components.
          </p>
        </div>
      </WlHomeV2ProfileArchiveShell>
    </WlHomeV2>
  )
}
