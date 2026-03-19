import { RadioEmbed } from "@/components/radio-embed"

/**
 * Renders the WTED Radio embed above the header on mobile only.
 * Placed in the layout so it persists across navigation (iframe state preserved).
 * Uses md:hidden so it shows below 768px (matches useIsMobile breakpoint).
 */
export function MobileRadioBar() {
  return (
    <div className="shrink-0 border-b border-border bg-background px-2 py-1.5 md:hidden">
      <RadioEmbed />
    </div>
  )
}
