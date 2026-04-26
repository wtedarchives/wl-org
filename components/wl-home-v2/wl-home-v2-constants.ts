/** Discourse / community hub (planned: https://community.wted.org when live). */
export const WL_HOME_V2_COMMUNITY_URL = "https://community.wysterialane.org"

/**
 * Fixed id for the primary mobile nav region (`#` + this string on `<nav>`). Avoids
 * `useId`/`aria-controls` hydration mismatches when the header’s first subtree (e.g. radio slot)
 * differs in hook order between server and client.
 */
export const WL_HOME_V2_TOP_NAV_PANEL_ID = "wl-home-v2-top-nav-panel"
