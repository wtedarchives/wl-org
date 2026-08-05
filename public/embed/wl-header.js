/*
 * <wl-header> — embeddable Wysteria Lane / WTED Radio site header.
 *
 * Self-contained custom element (Shadow DOM, no framework runtime, no globals
 * other than the registered tag). Designed to be loaded by the Discourse theme
 * for community.wysterialane.org via a single <script src> tag.
 *
 * Markup and styles mirror components/wl-home-v2/wl-home-v2-header.tsx (no user menu).
 */
(function () {
  if (typeof window === "undefined") return;
  if (window.customElements && customElements.get("wl-header")) return;

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  /** Nav / page links — production site. */
  var WTED_BASE = "https://wtedradio.com";
  var COMMUNITY_URL = "https://community.wysterialane.org";
  /** Absolute — Community hosts this script cross-origin. Cache-bust with `?_=`. */
  var RADIO_IFRAME_PATH = WTED_BASE + "/radio-player/player-markup.html";
  var RADIO_IFRAME_SRC = RADIO_IFRAME_PATH + "?_=" + Date.now();

  /** Image host — same origin as production site after cutover. */
  var ASSET_BASE = "https://wtedradio.com";
  // Rollback — Netlify default host:
  // var ASSET_BASE = "https://wted-org.netlify.app";

  var IMG_WL = ASSET_BASE + "/WL.png";
  var IMG_WTED_DESKTOP = ASSET_BASE + "/WTED.png";
  var IMG_WTED_MOBILE = ASSET_BASE + "/WTED.png";
  var IMG_ARCHIVE = ASSET_BASE + "/wted-sa-cropped-2.png";
  /** Same asset as logged-out homepage “My Show Stats” tile. */
  var IMG_STATS = ASSET_BASE + "/icon-myprofile.png";
  var STATS_URL = WTED_BASE + "/archive/profile?tab=overview";

  var TOP_NAV_PANEL_ID = "wl-home-v2-top-nav-panel";

  var TICKER_PHRASES = [
    "Visions of members vast.",
    "So ready for this.",
    "It's alright – don't sweat my friend.",
    "Go everywhere, feel everything, see everyone.",
    "Keep it Ted!",
    "Just a little bit goes a long, long way.",
    "Down the pathway to the great beyond.",
    "Come and get some pancakes!",
    "Seep up all the light.",
    "Is it all a vision?",
  ];

  var PHRASE_ROTATE_MS = 8000;
  var PHRASE_DISSOLVE_MS = 400;

  // --------------------------------------------------------------------------
  // Inline icons (mobile menu toggle + Support / Follow Us)
  // --------------------------------------------------------------------------

  var ICON_LIST =
    '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">' +
    '<path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/>' +
    "</svg>";

  var ICON_X =
    '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">' +
    '<path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>' +
    "</svg>";

  /** Phosphor CurrencyDollar regular — matches React header Support icon. */
  var ICON_CURRENCY_DOLLAR =
    '<svg class="top-nav-primary-icon" viewBox="0 0 256 256" width="18" height="18" fill="currentColor" aria-hidden="true">' +
    '<path d="M152,120H136V56h8a32,32,0,0,1,32,32,8,8,0,0,0,16,0,48.05,48.05,0,0,0-48-48h-8V24a8,8,0,0,0-16,0V40h-8a48,48,0,0,0,0,96h8v64H104a32,32,0,0,1-32-32,8,8,0,0,0-16,0,48.05,48.05,0,0,0,48,48h16v16a8,8,0,0,0,16,0V216h16a48,48,0,0,0,0-96Zm-40,0a32,32,0,0,1,0-64h8v64Zm40,80H136V136h16a32,32,0,0,1,0,64Z"/>' +
    "</svg>";

  /** Phosphor ArrowRight regular — matches React header Follow Us icon. */
  var ICON_ARROW_RIGHT =
    '<svg class="top-nav-primary-icon" viewBox="0 0 256 256" width="18" height="18" fill="currentColor" aria-hidden="true">' +
    '<path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>' +
    "</svg>";

  /** Phosphor MagnifyingGlass regular — site search trigger. */
  var ICON_MAGNIFYING_GLASS =
    '<svg class="wl-site-search-icon" viewBox="0 0 256 256" width="22" height="22" fill="currentColor" aria-hidden="true">' +
    '<path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>' +
    "</svg>";

  var SITE_SEARCH_MIN_Q = 2;
  var SITE_SEARCH_PATH = "/api/site-search";
  var SITE_SEARCH_MODAL_EXIT_MS = 200;
  var SITE_SEARCH_IDLE =
    "Press enter to search WTED Archives.";
  var ICON_MAGNIFYING_GLASS_SM =
    '<svg class="wl-site-search-icon" viewBox="0 0 256 256" width="16" height="16" fill="currentColor" aria-hidden="true">' +
    '<path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>' +
    "</svg>";

  // --------------------------------------------------------------------------
  // Styles (ported from components/wl-home-v2/wl-home-v2.css, scoped to :host)
  // --------------------------------------------------------------------------

  var STYLES = [
    ":host {",
    "  display: block;",
    "  --wl-deep-green: #65b3a0;",
    "  --wl-light-orange: oklch(0.82 0.10 55);",
    "  --wl-white: #ffffff;",
    "  --panel-bg: #313a34;",
    "  --panel-border: rgb(24, 25, 24);",
    '  font-family: "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif;',
    "  color: var(--wl-white);",
    "  background: #65b3a0;",
    '  font-variant-numeric: tabular-nums;',
    '  font-feature-settings: "tnum" 1;',
    "}",
    ":host *, :host *::before, :host *::after { box-sizing: border-box; }",

    "header.top {",
    "  position: relative; z-index: 5;",
    "  display: grid;",
    "  grid-template-columns: minmax(0, 360px) minmax(0, 1fr) minmax(0, 360px);",
    "  grid-template-rows: auto;",
    '  grid-template-areas: "brand radio controls";',
    "  align-items: center;",
    "  column-gap: 24px;",
    "  padding: 8px 28px;",
    "}",
    "header.top .top-embed-row {",
    "  grid-area: radio;",
    "  justify-self: stretch;",
    "  width: 100%;",
    "  min-width: 0;",
    "}",
    "header.top .top-embed-row .radio-embed-wrap--header {",
    "  width: 100%;",
    "  min-width: 0;",
    "}",
    "header.top .top-header-controls {",
    "  grid-area: controls;",
    "  justify-self: end;",
    "  display: flex;",
    "  align-items: flex-end;",
    "  justify-content: flex-end;",
    "  min-width: 0;",
    "  max-width: 360px;",
    "  width: 100%;",
    "}",
    "header.top .top-header-controls-stack {",
    "  display: flex;",
    "  flex-direction: column;",
    "  align-items: stretch;",
    "  gap: 0;",
    "  width: max-content;",
    "  max-width: 100%;",
    "  min-width: 0;",
    "}",
    "header.top .top-header-controls-top-row,",
    "header.top #" + TOP_NAV_PANEL_ID + ".top-nav,",
    "header.top .top-header-controls .top-nav-primary-row,",
    "header.top .top-header-controls .top-nav-secondary-row {",
    "  align-items: center;",
    "}",
    "header.top .top-header-controls-top-row {",
    "  display: flex;",
    "  gap: 14px;",
    "  min-width: 0;",
    "}",
    "header.top .top-brand-cluster {",
    "  grid-area: brand;",
    "  justify-self: start;",
    "  display: flex;",
    "  flex-direction: column;",
    "  align-items: flex-start;",
    "  gap: 5px;",
    "  min-width: 0;",
    "  max-width: 360px;",
    "  width: max-content;",
    "}",
    "header.top .top-brand-cluster-top {",
    "  display: flex;",
    "  align-items: center;",
    "  gap: 14px;",
    "  min-width: 0;",
    "  width: auto;",
    "}",
    "header.top .top-brand-cluster-top .top-brand-cluster-actions {",
    "  margin-left: auto;",
    "}",
    "header.top .top-brand-cluster-phrase {",
    "  display: none;",
    "  margin: 0;",
    "  padding: 0;",
    "  max-width: 100%;",
    "  font-size: 12px;",
    "  font-weight: 500;",
    "  font-style: italic;",
    "  letter-spacing: 0.04em;",
    "  line-height: 1.25;",
    "  color: #000000;",
    "  text-align: center;",
    "  white-space: nowrap;",
    "  overflow: hidden;",
    "  text-overflow: ellipsis;",
    "  opacity: 1;",
    "  transition: opacity 0.4s ease;",
    "}",
    "header.top .top-brand-cluster-phrase--hiding { opacity: 0; }",
    "header.top .top-header-controls nav.top-nav {",
    "  justify-content: flex-end;",
    "  align-items: center;",
    "}",
    "header.top .top-header-controls nav.top-nav .top-nav-primary-row {",
    "  justify-content: flex-start;",
    "}",
    "header.top .top-mobile-nav-toggle { display: none; }",
    "header.top .top-user-cluster--mobile { display: none; }",
    "header.top .wl-site-search--desktop { display: none; }",
    ".top-brand-cluster-actions {",
    "  display: none;",
    "  flex-direction: column;",
    "  align-items: stretch;",
    "  gap: 4px;",
    "  flex-shrink: 0;",
    "}",
    ".top-nav-secondary-row { display: none; align-items: center; }",
    ".top-brand-cluster-actions > a {",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: space-between;",
    "  gap: 8px;",
    "  width: 100%;",
    "  min-width: 6rem;",
    "  box-sizing: border-box;",
    "  font-size: 12px;",
    "  font-weight: 500;",
    "  color: #000000;",
    "  text-decoration: none;",
    "  padding: 3px 10px;",
    "  border-radius: 8px;",
    "  background: rgb(255, 170, 129);",
    "  border: 1px solid #5b877b;",
    "  box-shadow: 0 10px 28px -8px rgba(0, 0, 0, 0.85);",
    "  transition: background 0.15s, border-color 0.15s;",
    "}",
    ".top-brand-cluster-actions > a:first-child {",
    "  border-left: 0;",
    "  border-right: 0;",
    "  border-top: 0;",
    "}",
    ".top-brand-cluster-actions > a:last-child {",
    "  border-right: 0;",
    "  border-top: 0;",
    "}",
    ".top-brand-cluster-actions > a:hover {",
    "  background: rgb(245, 155, 112);",
    "  border-color: #5b877b;",
    "}",
    ".top-brand-cluster-actions > a:first-child:hover { border-left: 0; border-right: 0; border-top: 0; }",
    ".top-brand-cluster-actions > a:last-child:hover { border-right: 0; border-top: 0; }",
    ".top-brand-cluster-actions > a .top-nav-primary-icon {",
    "  flex-shrink: 0;",
    "  width: 18px;",
    "  height: 18px;",
    "  color: #000000;",
    "  opacity: 1;",
    "}",

    "a.brand {",
    "  display: flex;",
    "  align-items: center;",
    "  gap: 8px;",
    "  text-decoration: none;",
    "  color: #000000;",
    "  border-radius: 12px;",
    "  transform-origin: center center;",
    "  transition: transform 0.2s cubic-bezier(0.2,0.7,0.2,1), outline-offset 0.15s;",
    "}",
    "a.brand:hover { transform: scale(1.05); }",
    "a.brand:hover .brand-mark {",
    "  background: rgba(255,255,255,0.1);",
    "}",
    "a.brand:focus-visible {",
    "  outline: 2px solid var(--wl-light-orange);",
    "  outline-offset: 3px;",
    "}",
    ".brand-mark {",
    "  position: relative;",
    "  width: 36px; height: 36px; border-radius: 10px;",
    "  background: rgba(14, 16, 21, 0.5);",
    "  border: 1px solid #5b877b;",
    "  display: grid; place-items: center;",
    "  overflow: hidden;",
    "  transition: background 0.18s ease, border-color 0.18s ease;",
    "}",
    ".brand-mark img { width: 72%; height: 72%; object-fit: contain; }",
    ".brand-text { display: flex; flex-direction: column; line-height: 1; }",
    ".brand-text .wl,",
    ".brand-text .dotorg {",
    "  font-weight: 700;",
    "  letter-spacing: -0.01em;",
    "  font-size: 15px;",
    "  color: #000000;",
    "}",
    ".brand-text .dotorg { margin-top: 1px; }",

    "nav.top-nav {",
    "  display: flex;",
    "  flex-direction: row;",
    "  align-items: center;",
    "  flex-wrap: wrap;",
    "  gap: 6px;",
    "}",
    "nav.top-nav .top-nav-primary-row {",
    "  display: flex;",
    "  flex-wrap: wrap;",
    "  align-items: center;",
    "  gap: 4px;",
    "}",
    "nav.top-nav .top-nav-primary-row > a,",
    "nav.top-nav .top-nav-secondary-row > a {",
    "  display: inline-flex;",
    "  align-items: center;",
    "  gap: 6px;",
    "  font-size: 12px; font-weight: 500; color: #000000;",
    "  text-decoration: none; padding: 3px 6px; border-radius: 8px;",
    "  transition: color .15s, background .15s;",
    "}",
    "nav.top-nav .top-nav-primary-row > a:hover,",
    "nav.top-nav .top-nav-secondary-row > a:hover {",
    "  color: #000000; background: rgba(255,255,255,0.06);",
    "}",
    "nav.top-nav .top-nav-primary-icon {",
    "  flex-shrink: 0;",
    "  width: 18px;",
    "  height: 18px;",
    "  color: #000000;",
    "  opacity: 0.92;",
    "}",
    "nav.top-nav .top-nav-secondary-row > a .top-nav-primary-icon {",
    "  color: #000000;",
    "  opacity: 1;",
    "}",
    "nav.top-nav .top-nav-primary-icon svg { width: 100%; height: 100%; display: block; }",
    "nav.top-nav .top-nav-primary-icon.top-nav-primary-icon--img {",
    "  display: inline-flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  width: auto;",
    "  height: 22px;",
    "  flex-shrink: 0;",
    "  opacity: 1;",
    "}",
    "nav.top-nav .top-nav-primary-icon.top-nav-primary-icon--img.top-nav-radio-img--mobile {",
    "  display: none;",
    "}",
    "nav.top-nav .top-nav-primary-img {",
    "  width: auto;",
    "  height: 22px;",
    "  max-width: none;",
    "  object-fit: contain;",
    "}",

    ".top-mobile-nav-toggle {",
    "  align-items: center;",
    "  justify-content: center;",
    "  min-width: 44px;",
    "  min-height: 44px;",
    "  padding: 0;",
    "  border: 0;",
    "  border-radius: 10px;",
    "  background: transparent;",
    "  color: #000000;",
    "  cursor: pointer;",
    "  transition: color 0.15s, background 0.15s;",
    "}",
    ".top-mobile-nav-toggle:hover { color: #000000; background: rgba(255,255,255,0.06); }",
    ".top-mobile-nav-toggle:focus-visible { outline: 2px solid var(--wl-light-orange); outline-offset: 2px; }",
    ".top-mobile-nav-icon { width: 22px; height: 22px; flex-shrink: 0; display: block; }",

    ".radio-embed-wrap {",
    "  border-radius: 10px;",
    "  overflow: hidden;",
    "  border: 1px solid #5b877b;",
    "  background: rgba(0, 0, 0, 0.48);",
    "  backdrop-filter: blur(6px);",
    "  -webkit-backdrop-filter: blur(6px);",
    "  width: 100%;",
    "}",
    ".radio-embed { display: block; width: 100%; height: 76px; border: 0; }",

    "@media (min-width: 1344px) {",
    "  header.top .top-brand-cluster .brand-mark {",
    "    width: 42px; height: 42px; border-radius: 11px;",
    "  }",
    "  header.top .top-brand-cluster .brand-text .wl,",
    "  header.top .top-brand-cluster .brand-text .dotorg { font-size: 17px; }",
    "  header.top .top-brand-cluster .brand-text .dotorg { margin-top: 1px; }",
    "  header.top .wl-site-search--desktop {",
    "    display: block;",
    "    position: relative;",
    "    z-index: 2;",
    "    width: 100%;",
    "    margin-top: 4px;",
    "  }",
    "  header.top .top-header-controls nav.top-nav .top-nav-primary-row > a {",
    "    color: #000000;",
    "    background: rgb(255, 170, 129);",
    "    border: 1px solid #5b877b;",
    "    box-shadow: 0 10px 28px -8px rgba(0, 0, 0, 0.85);",
    "    transition: background 0.15s, border-color 0.15s;",
    "  }",
    "  header.top .top-header-controls nav.top-nav .top-nav-primary-row > a:nth-child(1) {",
    "    border-left: 0;",
    "    border-right: 0;",
    "  }",
    "  header.top .top-header-controls nav.top-nav .top-nav-primary-row > a:nth-child(2),",
    "  header.top .top-header-controls nav.top-nav .top-nav-primary-row > a:nth-child(3) {",
    "    border-right: 0;",
    "  }",
    "  header.top .top-header-controls nav.top-nav .top-nav-primary-row > a:nth-child(4) {",
    "    border-right: 0;",
    "  }",
    "  header.top .top-header-controls nav.top-nav .top-nav-primary-row > a:hover {",
    "    color: #000000;",
    "    background: rgb(245, 155, 112);",
    "    border-color: #5b877b;",
    "  }",
    "  header.top .top-header-controls nav.top-nav .top-nav-primary-row > a:nth-child(1):hover {",
    "    border-left: 0;",
    "    border-right: 0;",
    "  }",
    "  header.top .top-header-controls nav.top-nav .top-nav-primary-row > a:nth-child(2):hover,",
    "  header.top .top-header-controls nav.top-nav .top-nav-primary-row > a:nth-child(3):hover,",
    "  header.top .top-header-controls nav.top-nav .top-nav-primary-row > a:nth-child(4):hover {",
    "    border-right: 0;",
    "  }",
    "  .top-brand-cluster-actions { display: flex; }",
    "  header.top .top-brand-cluster-phrase {",
    "    display: block;",
    "    width: 100%;",
    "    max-width: 360px;",
    "  }",
    "}",

    "@media (max-width: 1343px) {",
    "  header.top {",
    "    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);",
    "    grid-template-rows: auto auto auto auto;",
    "    grid-template-areas:",
    '      "radio radio radio"',
    '      "phrase phrase phrase"',
    '      "menu brand spacer"',
    '      "drawer drawer drawer";',
    "    row-gap: 0;",
    "    column-gap: 10px;",
    "    padding: 8px;",
    "  }",
    "  header.top .top-header-controls,",
    "  header.top .top-header-controls-stack,",
    "  header.top .top-header-controls-top-row { display: contents; }",
    "  header.top .top-embed-row {",
    "    grid-area: radio;",
    "    justify-self: stretch;",
    "    width: 100%;",
    "    margin-bottom: 0;",
    "  }",
    "  header.top .top-brand-cluster { display: contents; }",
    "  header.top .top-brand-cluster-top {",
    "    grid-area: brand;",
    "    justify-self: center;",
    "    align-self: center;",
    "  }",
    "  header.top .top-brand-cluster-phrase {",
    "    display: block;",
    "    grid-area: phrase;",
    "    width: 100%;",
    "    max-width: 100%;",
    "    box-sizing: border-box;",
    "    margin-top: 6px;",
    "    margin-bottom: 10px;",
    "    text-align: center;",
    "  }",
    "  header.top .top-mobile-nav-toggle {",
    "    display: inline-flex;",
    "    grid-area: menu;",
    "    justify-self: start;",
    "    align-self: center;",
    "  }",
    "  header.top .top-user-cluster--mobile {",
    "    display: inline-flex;",
    "    grid-area: spacer;",
    "  }",
    "  header.top .wl-site-search--desktop { display: none; }",
    "  nav.top-nav .top-nav-primary-icon.top-nav-primary-icon--img.top-nav-radio-img--desktop {",
    "    display: none;",
    "  }",
    "  nav.top-nav .top-nav-primary-icon.top-nav-primary-icon--img.top-nav-radio-img--mobile {",
    "    display: inline-flex;",
    "  }",
    "  header.top nav.top-nav {",
    "    grid-area: drawer;",
    "    justify-self: stretch;",
    "    display: flex;",
    "    flex-direction: column;",
    "    align-items: stretch;",
    "    gap: 0;",
    "    max-height: 0;",
    "    opacity: 0;",
    "    overflow: hidden;",
    "    padding-top: 0;",
    "    padding-bottom: 0;",
    "    margin: 0;",
    "    border-top: 0;",
    "    transition:",
    "      max-height 0.28s ease-out,",
    "      opacity 0.22s ease-out,",
    "      padding-top 0.22s ease-out,",
    "      padding-bottom 0.22s ease-out,",
    "      margin-top 0.22s ease-out;",
    "    pointer-events: none;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row {",
    "    display: grid;",
    "    grid-template-columns: repeat(4, minmax(0, 1fr));",
    "    gap: 4px;",
    "    align-items: center;",
    "    width: 100%;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row {",
    "    display: grid;",
    "    grid-template-columns: repeat(2, minmax(0, 1fr));",
    "    gap: 4px;",
    "    align-items: center;",
    "    width: 100%;",
    "    margin-top: 4px;",
    "  }",
    "  header.top nav.top-nav.top-nav--mobile-open {",
    "    max-height: 140px;",
    "    opacity: 1;",
    "    margin-top: 10px;",
    "    padding-top: 10px;",
    "    padding-bottom: 0;",
    "    pointer-events: auto;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a,",
    "  header.top nav.top-nav .top-nav-secondary-row > a {",
    "    display: inline-flex;",
    "    flex-direction: column;",
    "    align-items: center;",
    "    justify-content: center;",
    "    gap: 6px;",
    "    text-align: center;",
    "    min-width: 0;",
    "    padding: 6px;",
    "    border-radius: 10px;",
    "    font-size: 12px;",
    "    font-weight: 500;",
    "    line-height: 1.15;",
    "    color: #000000;",
    "    text-decoration: none;",
    "    background: rgba(255, 255, 255, 0.07);",
    "    border: 1px solid #5b877b;",
    "    box-shadow: 0 10px 28px -8px rgba(0, 0, 0, 0.85);",
    "    transition: background 0.18s, border-color 0.18s, color 0.15s;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(1) {",
    "    border-left: 0;",
    "    border-right: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(2),",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(3) {",
    "    border-right: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(4) {",
    "    border-right: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(1) {",
    "    border-left: 0;",
    "    border-right: 0;",
    "    border-top: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(2) {",
    "    border-right: 0;",
    "    border-top: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row > a { padding: 6px; }",
    "  header.top nav.top-nav .top-nav-primary-icon { width: 16px; height: 16px; color: #000000; }",
    "  header.top nav.top-nav .top-nav-secondary-row > a .top-nav-primary-icon {",
    "    color: #000000;",
    "    opacity: 1;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-icon.top-nav-primary-icon--img {",
    "    width: auto; height: 22px;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-img { width: auto; height: 22px; }",
    "  header.top nav.top-nav .top-nav-primary-row > a:hover,",
    "  header.top nav.top-nav .top-nav-secondary-row > a:hover {",
    "    background: rgba(88, 200, 174, 0.18);",
    "    border-color: #5b877b;",
    "    color: #000000;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(1):hover { border-left: 0; border-right: 0; }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(2):hover,",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(3):hover,",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(4):hover { border-right: 0; }",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(1):hover { border-left: 0; border-right: 0; border-top: 0; }",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(2):hover { border-right: 0; border-top: 0; }",
    "  header.top:has(nav.top-nav.top-nav--mobile-open) {",
    "    padding-bottom: 0;",
    "    border-bottom: 0;",
    "  }",
    "}",

    "@media (min-width: 768px) and (max-width: 1343px) {",
    "  header.top nav.top-nav.top-nav--mobile-open {",
    "    box-sizing: border-box;",
    "    padding-top: 0;",
    "    padding-bottom: 0;",
    "    margin-top: 6px;",
    "    margin-left: calc(50% - 50vw);",
    "    margin-right: 0;",
    "    width: 100vw;",
    "    max-width: 100vw;",
    "    min-width: 0;",
    "    max-height: 108px;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row {",
    "    display: grid;",
    "    grid-template-columns: repeat(4, minmax(0, 1fr));",
    "    gap: 0;",
    "    align-items: center;",
    "    width: 100%;",
    "    max-width: none;",
    "    box-sizing: border-box;",
    "    margin-left: 0;",
    "    margin-right: 0;",
    "    border: 1px solid #5b877b;",
    "    border-top: 0;",
    "    border-radius: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row {",
    "    display: grid;",
    "    grid-template-columns: repeat(2, minmax(0, 1fr));",
    "    gap: 0;",
    "    align-items: center;",
    "    width: 100%;",
    "    max-width: none;",
    "    box-sizing: border-box;",
    "    margin-left: 0;",
    "    margin-right: 0;",
    "    margin-top: 0;",
    "    border: 1px solid #5b877b;",
    "    border-top: 0;",
    "    border-radius: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a,",
    "  header.top nav.top-nav .top-nav-secondary-row > a {",
    "    flex-direction: row;",
    "    align-items: center;",
    "    justify-content: center;",
    "    gap: 6px;",
    "    text-align: left;",
    "    margin: 0;",
    "    padding: 3px 6px;",
    "    border-radius: 0;",
    "    color: #000000;",
    "    text-decoration: none;",
    "    background: rgba(255, 255, 255, 0.07);",
    "    border: 1px solid #5b877b;",
    "    box-shadow: none;",
    "    transform: none;",
    "    transition: background 0.18s, border-color 0.18s, color 0.15s;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a {",
    "    padding: 6px;",
    "    font-size: 12px;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row > a { padding: 6px; }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(1) {",
    "    border-left: 0;",
    "    border-right: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(2),",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(3) {",
    "    border-right: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(4) {",
    "    border-right: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(1) {",
    "    border-left: 0;",
    "    border-right: 0;",
    "    border-top: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(2) {",
    "    border-right: 0;",
    "    border-top: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:hover,",
    "  header.top nav.top-nav .top-nav-secondary-row > a:hover {",
    "    color: #000000;",
    "    background: rgba(88, 200, 174, 0.18);",
    "    transform: none;",
    "    border-color: #5b877b;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(1):hover { border-left: 0; border-right: 0; }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(2):hover,",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(3):hover,",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(4):hover { border-right: 0; }",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(1):hover { border-left: 0; border-right: 0; border-top: 0; }",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(2):hover { border-right: 0; border-top: 0; }",
    "}",

    "@media (max-width: 767px) {",
    "  header.top .top-brand-cluster-top {",
    "    justify-content: center;",
    "    align-items: center;",
    "    width: auto;",
    "    max-width: calc(100vw - 120px);",
    "  }",
    "  header.top .top-brand-cluster-top .brand { justify-content: center; }",
    "  header.top .top-brand-cluster-top .brand-text .wl {",
    "    align-self: flex-start;",
    "    text-align: left;",
    "  }",
    "  header.top nav.top-nav.top-nav--mobile-open {",
    "    box-sizing: border-box;",
    "    padding-top: 0;",
    "    padding-bottom: 0;",
    "    margin-top: 6px;",
    "    margin-left: calc(50% - 50vw);",
    "    margin-right: 0;",
    "    width: 100vw;",
    "    max-width: 100vw;",
    "    min-width: 0;",
    "    max-height: 260px;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row,",
    "  header.top nav.top-nav .top-nav-secondary-row {",
    "    gap: 0;",
    "    border: 0;",
    "    border-radius: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row { margin-top: 0; }",
    "  header.top nav.top-nav .top-nav-primary-row > a,",
    "  header.top nav.top-nav .top-nav-secondary-row > a {",
    "    flex-direction: row;",
    "    text-align: left;",
    "    padding: 6px 0;",
    "    margin: 0;",
    "    border-radius: 0;",
    "    color: #000000;",
    "    border: 1px solid #5b877b;",
    "    box-shadow: none;",
    "    transform: none;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(1) {",
    "    border-left: 0;",
    "    border-right: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(2),",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(3) {",
    "    border-right: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(4) {",
    "    border-right: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(1) {",
    "    border-left: 0;",
    "    border-right: 0;",
    "    border-top: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(2) {",
    "    border-right: 0;",
    "    border-top: 0;",
    "  }",
    "}",

    "@media (prefers-reduced-motion: reduce) {",
    "  a.brand { transition: outline-offset 0.15s; }",
    "  a.brand:hover { transform: none; }",
    "  header.top nav.top-nav { transition: none; }",
    "  header.top .top-brand-cluster-phrase { transition: none; }",
    "  .wl-site-search-backdrop,",
    "  .wl-site-search-modal,",
    "  .wl-site-search-popover { transition: none; }",
    "}",

    /* —— Site search (modal; same-origin /api/site-search proxy) —— */
    ".top-user-cluster--mobile {",
    "  align-items: center;",
    "  justify-content: flex-end;",
    "  justify-self: end;",
    "  align-self: center;",
    "}",
    ".wl-site-search-trigger {",
    "  display: inline-flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  gap: 6px;",
    "  min-width: 34px;",
    "  min-height: 34px;",
    "  padding: 0 8px 0 6px;",
    "  border: 0;",
    "  border-radius: 10px;",
    "  background: transparent;",
    "  color: #000000;",
    "  cursor: pointer;",
    "  font: inherit;",
    "  transition: color 0.15s, background 0.15s;",
    "}",
    ".wl-site-search-trigger:hover { background: rgba(255,255,255,0.06); }",
    ".wl-site-search-trigger:focus-visible {",
    "  outline: 2px solid var(--wl-light-orange);",
    "  outline-offset: 2px;",
    "}",
    ".wl-site-search-trigger__label {",
    "  font-size: 12px;",
    "  font-weight: 500;",
    "  line-height: 1;",
    "  white-space: nowrap;",
    "}",
    "@media (max-width: 539px) {",
    "  .top-user-cluster--mobile .wl-site-search-trigger__label { display: none; }",
    "}",
    ".wl-site-search-icon { display: block; flex-shrink: 0; }",
    ".wl-site-search-backdrop {",
    "  position: fixed;",
    "  inset: 0;",
    "  z-index: 80;",
    "  display: flex;",
    "  align-items: flex-start;",
    "  justify-content: center;",
    "  padding: 12px;",
    "  padding-top: max(12px, env(safe-area-inset-top));",
    "  background: rgba(0, 0, 0, 0.55);",
    "  opacity: 0;",
    "  pointer-events: none;",
    "  transition: opacity 0.2s ease-out;",
    "}",
    ".wl-site-search-backdrop.open {",
    "  opacity: 1;",
    "  pointer-events: auto;",
    "}",
    ".wl-site-search-modal {",
    "  width: min(520px, 96vw);",
    "  max-height: min(85vh, 640px);",
    "  margin-top: 8vh;",
    "  display: flex;",
    "  flex-direction: column;",
    "  border-radius: 14px;",
    "  border: 1px solid rgb(65, 68, 66);",
    "  background: rgb(22, 26, 24);",
    "  color: #fff;",
    "  box-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.85);",
    "  opacity: 0;",
    "  transform: translateY(-6px);",
    "  transition: opacity 0.2s ease-out, transform 0.2s ease-out;",
    "  overflow: hidden;",
    "}",
    ".wl-site-search-backdrop.open .wl-site-search-modal {",
    "  opacity: 1;",
    "  transform: translateY(0);",
    "}",
    ".wl-site-search-modal-head {",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: space-between;",
    "  gap: 12px;",
    "  padding: 14px 16px 10px;",
    "  flex-shrink: 0;",
    "}",
    ".wl-site-search-modal-head h3 {",
    "  margin: 0;",
    "  font-size: 1.05rem;",
    "  font-weight: 650;",
    "  color: #fff;",
    "}",
    ".wl-site-search-close {",
    "  width: 36px;",
    "  height: 36px;",
    "  border: 0;",
    "  border-radius: 8px;",
    "  background: transparent;",
    "  color: rgba(255,255,255,0.75);",
    "  font-size: 22px;",
    "  line-height: 1;",
    "  cursor: pointer;",
    "}",
    ".wl-site-search-close:hover { background: rgba(255,255,255,0.08); color: #fff; }",
    ".wl-site-search-modal-body {",
    "  display: flex;",
    "  flex-direction: column;",
    "  gap: 12px;",
    "  min-height: 0;",
    "  padding: 0 16px 16px;",
    "  overflow: hidden;",
    "}",
    ".wl-site-search-field {",
    "  display: flex;",
    "  align-items: stretch;",
    "  width: 100%;",
    "  border: 1px solid rgb(210, 125, 88);",
    "  border-radius: 8px;",
    "  background: rgb(255, 170, 129);",
    "  overflow: hidden;",
    "  flex-shrink: 0;",
    "}",
    ".wl-site-search--desktop .wl-site-search-field {",
    "  min-width: 0;",
    "}",
    ".wl-site-search--desktop .wl-site-search-input {",
    "  height: 24px;",
    "  font-size: 12px;",
    "  line-height: 1.2;",
    "}",
    ".wl-site-search--desktop .wl-site-search-submit {",
    "  width: 32px;",
    "  min-width: 32px;",
    "  height: 24px;",
    "}",
    ".wl-site-search-popover {",
    "  position: absolute;",
    "  top: calc(100% + 6px);",
    "  right: 0;",
    "  left: 0;",
    "  z-index: 40;",
    "  max-height: min(70vh, 420px);",
    "  overflow-x: hidden;",
    "  overflow-y: auto;",
    "  -webkit-overflow-scrolling: touch;",
    "  padding: 10px 10px 12px;",
    "  border: 1px solid rgb(65, 68, 66);",
    "  border-radius: 10px;",
    "  background: rgb(22, 26, 24);",
    "  box-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.85);",
    "  opacity: 0;",
    "  transform: translateY(-4px);",
    "  pointer-events: none;",
    "  transition: opacity 0.2s ease-out, transform 0.2s ease-out;",
    "}",
    ".wl-site-search-popover--open {",
    "  opacity: 1;",
    "  transform: translateY(0);",
    "  pointer-events: auto;",
    "}",
    ".wl-site-search-input {",
    "  flex: 1 1 auto;",
    "  min-width: 0;",
    "  height: 40px;",
    "  margin: 0;",
    "  padding: 0 10px;",
    "  border: 0;",
    "  background: transparent;",
    "  color: #000;",
    "  font-size: 15px;",
    "  font-weight: 500;",
    "  outline: none;",
    "}",
    ".wl-site-search-input::placeholder { color: rgba(0,0,0,0.45); }",
    ".wl-site-search-submit {",
    "  flex: 0 0 auto;",
    "  display: inline-flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  width: 44px;",
    "  min-width: 44px;",
    "  height: 40px;",
    "  margin: 0;",
    "  padding: 0;",
    "  border: 0;",
    "  border-left: 1px solid rgb(210, 125, 88);",
    "  background: transparent;",
    "  color: #000;",
    "  cursor: pointer;",
    "}",
    ".wl-site-search-submit:hover { background: rgb(245, 155, 112); }",
    ".wl-site-search-results {",
    "  min-height: 0;",
    "  overflow-x: hidden;",
    "  overflow-y: auto;",
    "  -webkit-overflow-scrolling: touch;",
    "  flex: 1 1 auto;",
    "}",
    ".wl-site-search-status {",
    "  margin: 0;",
    "  padding: 6px 4px;",
    "  font-size: 12px;",
    "  line-height: 1.35;",
    "  color: rgba(255,255,255,0.65);",
    "}",
    ".wl-site-search-status--error { color: rgb(255, 170, 129); }",
    ".wl-site-search-sections {",
    "  display: flex;",
    "  flex-direction: column;",
    "  gap: 12px;",
    "}",
    ".wl-site-search-section-title {",
    "  margin: 0 0 2px;",
    "  padding: 0 4px;",
    "  font-size: 10px;",
    "  font-weight: 700;",
    "  letter-spacing: 0.08em;",
    "  text-transform: uppercase;",
    "  color: rgba(255,255,255,0.45);",
    "}",
    ".wl-site-search-list {",
    "  list-style: none;",
    "  margin: 0;",
    "  padding: 0;",
    "  display: flex;",
    "  flex-direction: column;",
    "  gap: 1px;",
    "}",
    ".wl-site-search-hit {",
    "  display: flex;",
    "  flex-direction: column;",
    "  gap: 1px;",
    "  min-width: 0;",
    "  padding: 4px 8px;",
    "  border-radius: 8px;",
    "  text-decoration: none;",
    "  color: rgba(255,255,255,0.9);",
    "}",
    ".wl-site-search-hit:hover,",
    "  .wl-site-search-hit:focus-visible {",
    "  background: rgba(255,255,255,0.08);",
    "  outline: none;",
    "}",
    ".wl-site-search-hit-label {",
    "  font-size: 12px;",
    "  font-weight: 550;",
    "  line-height: 1.1;",
    "  word-break: break-word;",
    "}",
    ".wl-site-search-hit-detail {",
    "  font-size: 11px;",
    "  line-height: 1.1;",
    "  color: rgba(255,255,255,0.55);",
    "  word-break: break-word;",
    "}",
    ".wl-site-search-see-more {",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  width: 100%;",
    "  box-sizing: border-box;",
    "  margin-top: 2px;",
    "  padding: 4px;",
    "  font-size: 12px;",
    "  font-weight: 600;",
    "  text-align: center;",
    "  color: rgb(255, 170, 129);",
    "  text-decoration: none;",
    "  border-radius: 8px;",
    "}",
    ".wl-site-search-see-more:hover { background: rgba(255, 170, 129, 0.12); }",
  ].join("\n");

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  function navImgIcon(src, extraClass) {
    return (
      '<span class="top-nav-primary-icon top-nav-primary-icon--img' +
      (extraClass ? " " + extraClass : "") +
      '"><img class="top-nav-primary-img" src="' +
      src +
      '" alt=""></span>'
    );
  }

  function pickNextPhrase(previous) {
    var n = TICKER_PHRASES.length;
    if (n === 0) return "";
    if (n === 1) return TICKER_PHRASES[0];
    var next;
    do {
      next = TICKER_PHRASES[Math.floor(Math.random() * n)];
    } while (next === previous);
    return next;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Localhost uses same origin (next.dev rewrite); Community uses production site. */
  function siteSearchOrigin() {
    try {
      if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
        return window.location.origin;
      }
    } catch (e) {}
    return WTED_BASE;
  }

  function loadSiteSearchConfig() {
    if (window.__WL_SITE_SEARCH_CONFIG__ && window.__WL_SITE_SEARCH_CONFIG__.anonKey) {
      return Promise.resolve(window.__WL_SITE_SEARCH_CONFIG__);
    }
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector(
        'script[data-wl-site-search-config="1"]'
      );
      if (existing) {
        existing.addEventListener("load", function () {
          if (window.__WL_SITE_SEARCH_CONFIG__) {
            resolve(window.__WL_SITE_SEARCH_CONFIG__);
          } else {
            reject(new Error("Search config missing"));
          }
        });
        existing.addEventListener("error", function () {
          reject(new Error("Search config failed to load"));
        });
        return;
      }
      var script = document.createElement("script");
      script.src = siteSearchOrigin() + "/embed/wl-site-search-config.js";
      script.async = true;
      script.setAttribute("data-wl-site-search-config", "1");
      script.onload = function () {
        if (window.__WL_SITE_SEARCH_CONFIG__ && window.__WL_SITE_SEARCH_CONFIG__.anonKey) {
          resolve(window.__WL_SITE_SEARCH_CONFIG__);
        } else {
          reject(new Error("Search config missing"));
        }
      };
      script.onerror = function () {
        reject(new Error("Search config failed to load"));
      };
      document.head.appendChild(script);
    });
  }

  function archiveHref(pathWithQuery) {
    return WTED_BASE + pathWithQuery;
  }

  function searchSeeMoreHref(q, category) {
    var params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    var qs = params.toString();
    return archiveHref(qs ? "/archive/search?" + qs : "/archive/search");
  }

  function searchTriggerHtml(extraClass) {
    return (
      '<button type="button" class="wl-site-search-trigger' +
      (extraClass ? " " + extraClass : "") +
      '" aria-haspopup="dialog" aria-label="Search archive">' +
      ICON_MAGNIFYING_GLASS +
      '<span class="wl-site-search-trigger__label">Search</span>' +
      "</button>"
    );
  }

  function desktopSearchHtml() {
    return [
      '<div class="wl-site-search wl-site-search--desktop">',
      '<form class="wl-site-search-field wl-site-search-field--desktop" role="search">',
      '<label class="sr-only" for="wl-site-search-desktop-input" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">Search WTED Archives</label>',
      '<input id="wl-site-search-desktop-input" class="wl-site-search-input" type="search" name="q" placeholder="Search WTED Archives..." autocomplete="off" autocorrect="off" spellcheck="false">',
      '<button type="submit" class="wl-site-search-submit" aria-label="Search">' +
        ICON_MAGNIFYING_GLASS_SM +
        "</button>",
      "</form>",
      '<div class="wl-site-search-popover" hidden role="region" aria-label="Search results">',
      '<div class="wl-site-search-results">',
      '<p class="wl-site-search-status">' + SITE_SEARCH_IDLE + "</p>",
      "</div>",
      "</div>",
      "</div>",
    ].join("");
  }

  // --------------------------------------------------------------------------
  // Markup
  // --------------------------------------------------------------------------

  function template() {
    return [
      '<header class="top">',

      '<div class="top-embed-row">',
      '<div class="radio-embed-wrap radio-embed-wrap--header">',
      '<iframe class="radio-embed" title="WTED Radio" src="' +
        RADIO_IFRAME_SRC +
        '"></iframe>',
      "</div>",
      "</div>",

      '<button type="button" class="top-mobile-nav-toggle" aria-expanded="false" aria-controls="' +
        TOP_NAV_PANEL_ID +
        '" aria-label="Open site menu">',
      '<span class="top-mobile-nav-icon icon-list">' + ICON_LIST + "</span>",
      '<span class="top-mobile-nav-icon icon-x" style="display:none">' +
        ICON_X +
        "</span>",
      "</button>",

      '<div class="top-brand-cluster">',
      '<div class="top-brand-cluster-top">',
      '<a class="brand" href="' +
        COMMUNITY_URL +
        '" aria-label="Wysteria Lane Community home">',

      '<div class="brand-mark"><img src="' +
        IMG_WL +
        '" alt="" width="30" height="30"></div>',
      '<div class="brand-text">',
      '<span class="wl">Wysteria Lane</span>',
      '<span class="dotorg">Community</span>',
      "</div>",
      "</a>",
      '<div class="top-brand-cluster-actions">',
      '<a href="' + WTED_BASE + '/support">',
      ICON_CURRENCY_DOLLAR,
      "Support Us</a>",
      '<a href="' + WTED_BASE + '/links">',
      ICON_ARROW_RIGHT,
      "Follow Us</a>",
      "</div>",
      "</div>",
      '<p class="top-brand-cluster-phrase" aria-live="polite"></p>',
      "</div>",

      '<div class="top-header-controls">',
      '<div class="top-header-controls-stack">',
      '<div class="top-header-controls-top-row">',
      '<nav id="' +
        TOP_NAV_PANEL_ID +
        '" class="top-nav" aria-label="Primary">',
      '<div class="top-nav-primary-row">',
      '<a href="' + WTED_BASE + '/radio/episodes">',
      navImgIcon(IMG_WTED_DESKTOP, "top-nav-radio-img--desktop"),
      navImgIcon(IMG_WTED_MOBILE, "top-nav-radio-img--mobile"),
      "Radio</a>",
      '<a href="' + COMMUNITY_URL + '">',
      navImgIcon(IMG_WL),
      "Community</a>",
      '<a href="' + WTED_BASE + '/archive">',
      navImgIcon(IMG_ARCHIVE),
      "Archives</a>",
      '<a href="' + STATS_URL + '">',
      navImgIcon(IMG_STATS),
      "Stats</a>",
      "</div>",
      '<div class="top-nav-secondary-row">',
      '<a href="' + WTED_BASE + '/support">',
      ICON_CURRENCY_DOLLAR,
      "Support Us</a>",
      '<a href="' + WTED_BASE + '/links">',
      ICON_ARROW_RIGHT,
      "Follow Us</a>",
      "</div>",
      "</nav>",
      "</div>",
      desktopSearchHtml(),
      "</div>",
      "</div>",

      '<div class="top-user-cluster top-user-cluster--mobile">',
      searchTriggerHtml(),
      "</div>",

      "</header>",

      '<div class="wl-site-search-backdrop" hidden>',
      '<div class="wl-site-search-modal" role="dialog" aria-modal="true" aria-labelledby="wl-site-search-heading">',
      '<div class="wl-site-search-modal-head">',
      '<h3 id="wl-site-search-heading">Search</h3>',
      '<button type="button" class="wl-site-search-close" aria-label="Close">×</button>',
      "</div>",
      '<div class="wl-site-search-modal-body">',
      '<form class="wl-site-search-field wl-site-search-field--modal" role="search">',
      '<label class="sr-only" for="wl-site-search-input" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">Search WTED Archives</label>',
      '<input id="wl-site-search-input" class="wl-site-search-input" type="search" name="q" placeholder="Search WTED Archives..." autocomplete="off" autocorrect="off" spellcheck="false">',
      '<button type="submit" class="wl-site-search-submit" aria-label="Search">' +
        ICON_MAGNIFYING_GLASS +
        "</button>",
      "</form>",
      '<div class="wl-site-search-results wl-site-search-results--modal">',
      '<p class="wl-site-search-status">' + SITE_SEARCH_IDLE + "</p>",
      "</div>",
      "</div>",
      "</div>",
      "</div>",
    ].join("");
  }

  // --------------------------------------------------------------------------
  // Custom element
  // --------------------------------------------------------------------------

  function WlHeader() {
    var element = Reflect.construct(HTMLElement, [], WlHeader);
    var shadow = element.attachShadow({ mode: "open" });
    shadow.innerHTML = "<style>" + STYLES + "</style>" + template();
    element._navOpen = false;
    return element;
  }
  WlHeader.prototype = Object.create(HTMLElement.prototype);
  WlHeader.prototype.constructor = WlHeader;
  Object.setPrototypeOf(WlHeader, HTMLElement);

  WlHeader.prototype.connectedCallback = function () {
    var sr = this.shadowRoot;
    this._toggle = sr.querySelector(".top-mobile-nav-toggle");
    this._nav = sr.querySelector("nav.top-nav");
    this._iconList = sr.querySelector(".icon-list");
    this._iconX = sr.querySelector(".icon-x");
    this._phraseEl = sr.querySelector(".top-brand-cluster-phrase");

    this._searchBackdrop = sr.querySelector(".wl-site-search-backdrop");
    this._modalForm = sr.querySelector(".wl-site-search-field--modal");
    this._modalInput = sr.querySelector("#wl-site-search-input");
    this._modalResults = sr.querySelector(".wl-site-search-results--modal");
    this._searchClose = sr.querySelector(".wl-site-search-close");
    this._searchOpen = false;
    this._searchCloseTimer = null;

    this._desktopRoot = sr.querySelector(".wl-site-search--desktop");
    this._desktopForm = sr.querySelector(".wl-site-search-field--desktop");
    this._desktopInput = sr.querySelector("#wl-site-search-desktop-input");
    this._desktopPopover = sr.querySelector(".wl-site-search-popover");
    this._desktopResults = this._desktopPopover
      ? this._desktopPopover.querySelector(".wl-site-search-results")
      : null;
    this._desktopPopoverOpen = false;
    this._desktopPopoverTimer = null;

    var self = this;
    this._onToggleClick = function () {
      self._setOpen(!self._navOpen);
    };
    this._onLinkClick = function () {
      self._setOpen(false);
    };
    this._onKey = function (e) {
      if (e.key === "Escape") {
        if (self._searchOpen) {
          self._closeSiteSearch();
          return;
        }
        if (self._desktopPopoverOpen) {
          self._closeDesktopPopover();
          return;
        }
        if (self._navOpen) self._setOpen(false);
      }
    };
    this._onSearchOpenClick = function () {
      self._setOpen(false);
      self._closeDesktopPopover();
      self._openSiteSearch();
    };
    this._onSearchCloseClick = function () {
      self._closeSiteSearch();
    };
    this._onSearchBackdropClick = function (e) {
      if (e.target === self._searchBackdrop) self._closeSiteSearch();
    };
    this._onModalSearchSubmit = function (e) {
      e.preventDefault();
      self._runSiteSearch(
        self._modalInput ? self._modalInput.value : "",
        "modal"
      );
    };
    this._onDesktopSearchSubmit = function (e) {
      e.preventDefault();
      self._openDesktopPopover();
      self._runSiteSearch(
        self._desktopInput ? self._desktopInput.value : "",
        "desktop"
      );
    };
    this._onDesktopPointerDown = function (e) {
      if (!self._desktopPopoverOpen || !self._desktopRoot) return;
      var path = e.composedPath ? e.composedPath() : [];
      for (var i = 0; i < path.length; i++) {
        if (path[i] === self._desktopRoot) return;
      }
      self._closeDesktopPopover();
    };

    this._toggle.addEventListener("click", this._onToggleClick);
    var links = sr.querySelectorAll("header.top a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", this._onLinkClick);
    }
    var searchTriggers = sr.querySelectorAll(".wl-site-search-trigger");
    for (var t = 0; t < searchTriggers.length; t++) {
      searchTriggers[t].addEventListener("click", this._onSearchOpenClick);
    }
    if (this._searchClose) {
      this._searchClose.addEventListener("click", this._onSearchCloseClick);
    }
    if (this._searchBackdrop) {
      this._searchBackdrop.addEventListener("click", this._onSearchBackdropClick);
    }
    if (this._modalForm) {
      this._modalForm.addEventListener("submit", this._onModalSearchSubmit);
    }
    if (this._desktopForm) {
      this._desktopForm.addEventListener("submit", this._onDesktopSearchSubmit);
    }
    window.addEventListener("keydown", this._onKey);
    document.addEventListener("mousedown", this._onDesktopPointerDown);

    this._currentPhrase = TICKER_PHRASES[0] || "";
    if (this._phraseEl) {
      this._phraseEl.textContent = this._currentPhrase;
    }

    var reducedMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this._rotatePhrase = function () {
      if (!self._phraseEl) return;
      if (reducedMotion) {
        self._currentPhrase = pickNextPhrase(self._currentPhrase);
        self._phraseEl.textContent = self._currentPhrase;
        return;
      }
      self._phraseEl.classList.add("top-brand-cluster-phrase--hiding");
      window.setTimeout(function () {
        self._currentPhrase = pickNextPhrase(self._currentPhrase);
        self._phraseEl.textContent = self._currentPhrase;
        self._phraseEl.classList.remove("top-brand-cluster-phrase--hiding");
      }, PHRASE_DISSOLVE_MS);
    };

    this._phraseIntervalId = window.setInterval(
      this._rotatePhrase,
      PHRASE_ROTATE_MS
    );
  };

  WlHeader.prototype.disconnectedCallback = function () {
    if (this._toggle && this._onToggleClick) {
      this._toggle.removeEventListener("click", this._onToggleClick);
    }
    if (this._onKey) {
      window.removeEventListener("keydown", this._onKey);
    }
    if (this._onDesktopPointerDown) {
      document.removeEventListener("mousedown", this._onDesktopPointerDown);
    }
    if (this._phraseIntervalId) {
      window.clearInterval(this._phraseIntervalId);
    }
    if (this._searchCloseTimer) {
      window.clearTimeout(this._searchCloseTimer);
    }
    if (this._desktopPopoverTimer) {
      window.clearTimeout(this._desktopPopoverTimer);
    }
    if (this._searchOpen) {
      document.body.style.overflow = "";
    }
  };

  WlHeader.prototype._setOpen = function (open) {
    this._navOpen = !!open;
    this._nav.classList.toggle("top-nav--mobile-open", this._navOpen);
    this._toggle.setAttribute("aria-expanded", this._navOpen ? "true" : "false");
    this._toggle.setAttribute(
      "aria-label",
      this._navOpen ? "Close site menu" : "Open site menu"
    );
    this._iconList.style.display = this._navOpen ? "none" : "";
    this._iconX.style.display = this._navOpen ? "" : "none";
  };

  WlHeader.prototype._resultsEl = function (mode) {
    return mode === "desktop" ? this._desktopResults : this._modalResults;
  };

  WlHeader.prototype._openDesktopPopover = function () {
    var self = this;
    if (!this._desktopPopover) return;
    if (this._desktopPopoverTimer) {
      window.clearTimeout(this._desktopPopoverTimer);
      this._desktopPopoverTimer = null;
    }
    this._desktopPopoverOpen = true;
    this._desktopPopover.hidden = false;
    requestAnimationFrame(function () {
      self._desktopPopover.classList.add("wl-site-search-popover--open");
    });
  };

  WlHeader.prototype._closeDesktopPopover = function () {
    var self = this;
    if (!this._desktopPopover || !this._desktopPopoverOpen) return;
    this._desktopPopoverOpen = false;
    this._desktopPopover.classList.remove("wl-site-search-popover--open");
    this._desktopPopoverTimer = window.setTimeout(function () {
      self._desktopPopover.hidden = true;
      if (self._desktopResults) {
        self._desktopResults.innerHTML =
          '<p class="wl-site-search-status">' + SITE_SEARCH_IDLE + "</p>";
      }
      self._desktopPopoverTimer = null;
    }, SITE_SEARCH_MODAL_EXIT_MS);
  };

  WlHeader.prototype._openSiteSearch = function () {
    var self = this;
    if (!this._searchBackdrop) return;
    if (this._searchCloseTimer) {
      window.clearTimeout(this._searchCloseTimer);
      this._searchCloseTimer = null;
    }
    this._searchOpen = true;
    this._searchBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () {
      self._searchBackdrop.classList.add("open");
      if (self._modalInput) {
        self._modalInput.focus();
        self._modalInput.select();
      }
    });
  };

  WlHeader.prototype._closeSiteSearch = function () {
    var self = this;
    if (!this._searchBackdrop || !this._searchOpen) return;
    this._searchOpen = false;
    this._searchBackdrop.classList.remove("open");
    document.body.style.overflow = "";
    this._searchCloseTimer = window.setTimeout(function () {
      self._searchBackdrop.hidden = true;
      if (self._modalInput) self._modalInput.value = "";
      if (self._modalResults) {
        self._modalResults.innerHTML =
          '<p class="wl-site-search-status">' + SITE_SEARCH_IDLE + "</p>";
      }
      self._searchCloseTimer = null;
    }, SITE_SEARCH_MODAL_EXIT_MS);
  };

  WlHeader.prototype._setSearchStatus = function (mode, message, isError) {
    var el = this._resultsEl(mode);
    if (!el) return;
    el.innerHTML =
      '<p class="wl-site-search-status' +
      (isError ? " wl-site-search-status--error" : "") +
      '">' +
      escapeHtml(message) +
      "</p>";
  };

  WlHeader.prototype._renderSiteSearchResults = function (mode, data) {
    var el = this._resultsEl(mode);
    if (!el) return;

    var q = data && data.q ? String(data.q) : "";
    var hasMore = (data && data.hasMore) || {};
    var sections = [
      {
        key: "shows",
        title: "Shows",
        items: data.shows || [],
        href: function (hit) {
          return archiveHref(
            "/archive/setlist?id=" + encodeURIComponent(hit.id)
          );
        },
        label: function (hit) {
          return hit.label || "";
        },
        detail: function (hit) {
          return hit.detail || "";
        },
      },
      {
        key: "songs",
        title: "Songs",
        items: data.songs || [],
        href: function (hit) {
          return archiveHref("/archive/song?id=" + encodeURIComponent(hit.id));
        },
        label: function (hit) {
          return hit.song || "";
        },
      },
      {
        key: "discography",
        title: "Discography",
        items: data.discography || [],
        href: function (hit) {
          return archiveHref(
            "/archive/discography?id=" + encodeURIComponent(hit.id)
          );
        },
        label: function (hit) {
          return (hit.displayname || "").trim() || hit.name || "";
        },
      },
      {
        key: "venues",
        title: "Venues",
        items: data.venues || [],
        href: function (hit) {
          return archiveHref("/archive/venue?id=" + encodeURIComponent(hit.id));
        },
        label: function (hit) {
          return hit.label || "";
        },
      },
      {
        key: "tours",
        title: "Tours",
        items: data.tours || [],
        href: function (hit) {
          return archiveHref("/archive/tours?id=" + encodeURIComponent(hit.id));
        },
        label: function (hit) {
          return hit.tour || "";
        },
      },
      {
        key: "personnel",
        title: "Personnel",
        items: data.personnel || [],
        href: function (hit) {
          return archiveHref(
            "/archive/personnel?id=" + encodeURIComponent(hit.id)
          );
        },
        label: function (hit) {
          return hit.guest || "";
        },
      },
    ];

    var any = false;
    var html = ['<div class="wl-site-search-sections">'];
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];
      if (!section.items.length) continue;
      any = true;
      html.push("<section>");
      html.push(
        '<h4 class="wl-site-search-section-title">' +
          escapeHtml(section.title) +
          "</h4>"
      );
      html.push('<ul class="wl-site-search-list">');
      for (var j = 0; j < section.items.length; j++) {
        var hit = section.items[j];
        var detail =
          section.detail && section.detail(hit)
            ? '<span class="wl-site-search-hit-detail">' +
              escapeHtml(section.detail(hit)) +
              "</span>"
            : "";
        html.push(
          '<li><a class="wl-site-search-hit" href="' +
            escapeHtml(section.href(hit)) +
            '"><span class="wl-site-search-hit-label">' +
            escapeHtml(section.label(hit)) +
            "</span>" +
            detail +
            "</a></li>"
        );
      }
      html.push("</ul>");
      if (hasMore[section.key]) {
        html.push(
          '<a class="wl-site-search-see-more" href="' +
            escapeHtml(searchSeeMoreHref(q, section.key)) +
            '">See more ' +
            escapeHtml(section.title.toLowerCase()) +
            "</a>"
        );
      }
      html.push("</section>");
    }
    html.push("</div>");

    if (!any) {
      this._setSearchStatus(mode, 'No results for “' + q + '”.', false);
      return;
    }
    el.innerHTML = html.join("");
  };

  WlHeader.prototype._runSiteSearch = function (raw, mode) {
    var self = this;
    var target = mode === "desktop" ? "desktop" : "modal";
    var trimmed = String(raw || "").trim();
    if (trimmed.length < SITE_SEARCH_MIN_Q) {
      this._setSearchStatus(
        target,
        "Enter at least " + SITE_SEARCH_MIN_Q + " characters.",
        false
      );
      return;
    }

    this._setSearchStatus(target, "Searching…", false);

    loadSiteSearchConfig()
      .then(function (config) {
        var path = config.path || SITE_SEARCH_PATH;
        var url =
          siteSearchOrigin() + path + "?q=" + encodeURIComponent(trimmed);
        return fetch(url, {
          headers: {
            Authorization: "Bearer " + config.anonKey,
            apikey: config.anonKey,
          },
        }).then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok, status: res.status, body: body || {} };
          });
        });
      })
      .then(function (result) {
        if (!result.ok) {
          var err =
            typeof result.body.error === "string"
              ? result.body.error
              : "Search failed (" + result.status + ")";
          self._setSearchStatus(target, err, true);
          return;
        }
        self._renderSiteSearchResults(target, result.body);
      })
      .catch(function (err) {
        self._setSearchStatus(
          target,
          err && err.message ? err.message : "Search failed",
          true
        );
      });
  };

  customElements.define("wl-header", WlHeader);
})();
