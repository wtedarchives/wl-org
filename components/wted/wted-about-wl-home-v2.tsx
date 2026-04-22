"use client"

import {
  WTED_ABOUT_LAST_UPDATED,
  WtedAboutSectionContact,
  WtedAboutSectionGorp,
  WtedAboutSectionHowPaidFor,
  WtedAboutSectionWhatIs,
  WtedAboutSectionWhereMusic,
} from "@/components/wted/wted-about-shared"

export function WtedAboutWlHomeV2() {
  return (
    <>
      <header className="wl-home-v2-page-lede wl-home-v2-page-lede--about-row">
        <h1>About Us and FAQ</h1>
        <div className="wl-home-v2-page-lede-body">
          <p className="wl-home-v2-page-lede-meta">
            Last updated{" "}
            <span className="wl-home-v2-page-lede-meta-pill">
              {WTED_ABOUT_LAST_UPDATED}
            </span>
          </p>
        </div>
      </header>

      <section
        className="grid grid--about-faq-3x2"
        id="aboutFaqGrid"
        aria-label="About and FAQ"
      >
        <section className="tile tile-about tile-about--q1">
          <div className="tile-about-inner">
            <WtedAboutSectionWhatIs />
          </div>
        </section>

        <section className="tile tile-about tile-about--q2">
          <div className="tile-about-inner">
            <WtedAboutSectionWhereMusic />
          </div>
        </section>

        <section className="tile tile-about tile-about--q3 tile-about--span-rows">
          <div className="tile-about-inner">
            <WtedAboutSectionHowPaidFor />
          </div>
        </section>

        <section className="tile tile-about tile-about--q4">
          <div className="tile-about-inner">
            <WtedAboutSectionGorp />
          </div>
        </section>

        <section className="tile tile-about tile-about--q5">
          <div className="tile-about-inner">
            <WtedAboutSectionContact />
          </div>
        </section>
      </section>
    </>
  )
}
