import type { Metadata } from "next"
import Script from "next/script"

import { WL_HOME_V2_VISUAL_THEME_STORAGE_KEY } from "@/lib/wl-home-v2-visual-theme"

/**
 * Shell for the new homepage (`/`) and any future routes that share its IA.
 * Child pages use `title: "Page name"` → browser title `Page name — WTEDRadio.com`.
 * The index page overrides with `title.absolute` so the home tab is exactly `WTEDRadio.com`.
 */
export const metadata: Metadata = {
  title: {
    default: "WTEDRadio.com",
    template: "%s — WTEDRadio.com",
  },
}

export default function WlHomeV2RouteGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script
        id="wl-home-v2-visual-theme-boot"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var k=${JSON.stringify(WL_HOME_V2_VISUAL_THEME_STORAGE_KEY)};var t=localStorage.getItem(k);document.documentElement.dataset.wlV2Theme=(t==="big-modern"||t==="wted-default")?t:"wted-default";}catch(e){document.documentElement.dataset.wlV2Theme="wted-default";}})();`,
        }}
      />
      {children}
    </>
  )
}
