import { DESKTOP_CONTENT_MIN_WIDTH } from "@/hooks/use-mobile"

export const DEFAULT_YEAR_ID = "4ca4a7dd-19c5-45af-ab9b-6f7e20f4b445"
/** Must match the calendar year for {@link DEFAULT_YEAR_ID} in {@link NAV_YEARS}. */
export const DEFAULT_YEAR = "2026"
/** Desktop content layout breakpoint — must match {@link DESKTOP_CONTENT_MIN_WIDTH}. */
export const TAILWIND_XL_MIN_PX = DESKTOP_CONTENT_MIN_WIDTH
export const YEAR_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
