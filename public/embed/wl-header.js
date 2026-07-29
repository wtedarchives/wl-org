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
  var RADIO_IFRAME_SRC =
    "https://wtedradio.com/radio-player/player-markup.html";

  /** Image host — same origin as production site after cutover. */
  var ASSET_BASE = "https://wtedradio.com";
  // Rollback — Netlify default host:
  // var ASSET_BASE = "https://wted-org.netlify.app";

  var IMG_WL = ASSET_BASE + "/WL.png";
  var IMG_WTED_DESKTOP = ASSET_BASE + "/WTED.png";
  var IMG_WTED_MOBILE = ASSET_BASE + "/WTED2.png";
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

  // --------------------------------------------------------------------------
  // Styles (ported from components/wl-home-v2/wl-home-v2.css, scoped to :host)
  // --------------------------------------------------------------------------

  var STYLES = [
    ":host {",
    "  display: block;",
    "  --wl-deep-green: #285b4e;",
    "  --wl-light-orange: oklch(0.82 0.10 55);",
    "  --wl-white: #ffffff;",
    "  --panel-bg: #313a34;",
    "  --panel-border: rgb(24, 25, 24);",
    '  font-family: "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif;',
    "  color: var(--wl-white);",
    "  background:",
    "    linear-gradient(180deg, rgba(49,58,52,0.35) 0%, rgba(40,91,78,0.92) 80%),",
    "    var(--wl-deep-green);",
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
    "  border-bottom: 1px solid rgb(34, 37, 35);",
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
    "  color: rgba(255, 255, 255, 0.75);",
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
    "  border: 1px solid rgb(210, 125, 88);",
    "  box-shadow: 0 10px 28px -8px rgba(0, 0, 0, 0.85);",
    "  transition: background 0.15s, border-color 0.15s;",
    "}",
    ".top-brand-cluster-actions > a:hover {",
    "  background: rgb(245, 155, 112);",
    "  border-color: rgb(198, 118, 84);",
    "}",
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
    "  color: inherit;",
    "  border-radius: 12px;",
    "  transform-origin: center center;",
    "  transition: transform 0.2s cubic-bezier(0.2,0.7,0.2,1), outline-offset 0.15s;",
    "}",
    "a.brand:hover { transform: scale(1.05); }",
    "a.brand:hover .brand-mark {",
    "  background: rgba(255,255,255,0.1);",
    "  border-color: rgb(68,70,69);",
    "}",
    "a.brand:focus-visible {",
    "  outline: 2px solid var(--wl-light-orange);",
    "  outline-offset: 3px;",
    "}",
    ".brand-mark {",
    "  position: relative;",
    "  width: 36px; height: 36px; border-radius: 10px;",
    "  background: var(--panel-bg);",
    "  border: 1px solid var(--panel-border);",
    "  display: grid; place-items: center;",
    "  overflow: hidden;",
    "  transition: background 0.18s ease, border-color 0.18s ease;",
    "}",
    ".brand-mark img { width: 72%; height: 72%; object-fit: contain; }",
    ".brand-text { display: flex; flex-direction: column; line-height: 1; }",
    ".brand-text .wl { font-weight: 700; letter-spacing: -0.01em; font-size: 15px; }",
    '.brand-text .dotorg { font-family: "Geist Mono", ui-monospace, monospace; font-size: 10px; color: rgba(255,255,255,0.55); margin-top: 3px; letter-spacing: 0.04em; }',

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
    "  font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.8);",
    "  text-decoration: none; padding: 3px 6px; border-radius: 8px;",
    "  transition: color .15s, background .15s;",
    "}",
    "nav.top-nav .top-nav-primary-row > a:hover,",
    "nav.top-nav .top-nav-secondary-row > a:hover {",
    "  color: #fff; background: rgba(255,255,255,0.06);",
    "}",
    "nav.top-nav .top-nav-primary-icon {",
    "  flex-shrink: 0;",
    "  width: 18px;",
    "  height: 18px;",
    "  opacity: 0.92;",
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
    "  color: rgba(255,255,255,0.85);",
    "  cursor: pointer;",
    "  transition: color 0.15s, background 0.15s;",
    "}",
    ".top-mobile-nav-toggle:hover { color: #fff; background: rgba(255,255,255,0.06); }",
    ".top-mobile-nav-toggle:focus-visible { outline: 2px solid var(--wl-light-orange); outline-offset: 2px; }",
    ".top-mobile-nav-icon { width: 22px; height: 22px; flex-shrink: 0; display: block; }",

    ".radio-embed-wrap {",
    "  border-radius: 10px;",
    "  overflow: hidden;",
    "  border: 1px solid rgb(44, 46, 45);",
    "  background: rgba(0, 0, 0, 0.48);",
    "  backdrop-filter: blur(6px);",
    "  -webkit-backdrop-filter: blur(6px);",
    "  box-shadow: 0 8px 24px -10px rgba(0, 0, 0, 0.6);",
    "  width: 100%;",
    "}",
    ".radio-embed { display: block; width: 100%; height: 76px; border: 0; }",

    "@media (min-width: 1344px) {",
    "  header.top .top-brand-cluster .brand-mark {",
    "    width: 42px; height: 42px; border-radius: 11px;",
    "  }",
    "  header.top .top-brand-cluster .brand-text .wl { font-size: 17px; }",
    "  header.top .top-brand-cluster .brand-text .dotorg {",
    "    font-size: 11px; margin-top: 4px;",
    "  }",
    "  header.top .top-header-controls nav.top-nav .top-nav-primary-row > a {",
    "    color: #000000;",
    "    background: rgb(255, 170, 129);",
    "    border: 1px solid rgb(210, 125, 88);",
    "    box-shadow: 0 10px 28px -8px rgba(0, 0, 0, 0.85);",
    "    transition: background 0.15s, border-color 0.15s;",
    "  }",
    "  header.top .top-header-controls nav.top-nav .top-nav-primary-row > a:hover {",
    "    color: #000000;",
    "    background: rgb(245, 155, 112);",
    "    border-color: rgb(198, 118, 84);",
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
    "  header.top .top-spacer { grid-area: spacer; }",
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
    "    border-top: 1px solid rgb(39, 42, 40);",
    "    transition:",
    "      max-height 0.28s ease-out,",
    "      opacity 0.22s ease-out,",
    "      padding-top 0.22s ease-out,",
    "      padding-bottom 0.22s ease-out,",
    "      border-color 0.22s ease-out,",
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
    "    border-top-color: rgb(39, 42, 40);",
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
    "    color: rgba(255, 255, 255, 0.8);",
    "    text-decoration: none;",
    "    background: rgba(255, 255, 255, 0.07);",
    "    border: 1px solid rgb(65, 68, 66);",
    "    box-shadow: 0 10px 28px -8px rgba(0, 0, 0, 0.85);",
    "    transition: background 0.18s, border-color 0.18s, color 0.15s, transform 0.18s;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row > a { padding: 6px; }",
    "  header.top nav.top-nav .top-nav-primary-icon { width: 16px; height: 16px; }",
    "  header.top nav.top-nav .top-nav-primary-icon.top-nav-primary-icon--img {",
    "    width: auto; height: 22px;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-img { width: auto; height: 22px; }",
    "  header.top nav.top-nav .top-nav-primary-row > a:hover,",
    "  header.top nav.top-nav .top-nav-secondary-row > a:hover {",
    "    background: rgba(88, 200, 174, 0.18);",
    "    border-color: rgb(52, 109, 95);",
    "    color: #fff;",
    "    transform: translateY(-1px);",
    "  }",
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
    "    border: 1px solid rgb(49, 51, 49);",
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
    "    border: 1px solid rgb(49, 51, 49);",
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
    "    color: rgba(255, 255, 255, 0.8);",
    "    text-decoration: none;",
    "    background: rgba(255, 255, 255, 0.07);",
    "    border: 0;",
    "    border-right: 1px solid rgb(49, 51, 49);",
    "    box-shadow: none;",
    "    transform: none;",
    "    transition: background 0.18s, border-color 0.18s, color 0.15s;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a {",
    "    padding: 6px;",
    "    font-size: 12px;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row > a { padding: 6px; }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(4),",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(2) {",
    "    border-right: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:hover,",
    "  header.top nav.top-nav .top-nav-secondary-row > a:hover {",
    "    color: #fff;",
    "    background: rgba(88, 200, 174, 0.18);",
    "    transform: none;",
    "    border-right: 1px solid rgb(49, 51, 49);",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(4):hover,",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(2):hover {",
    "    border-right: 0;",
    "  }",
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
    "    border: 1px solid rgb(49, 51, 49);",
    "    border-top: 0;",
    "    border-radius: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-secondary-row { margin-top: 0; }",
    "  header.top nav.top-nav .top-nav-primary-row > a,",
    "  header.top nav.top-nav .top-nav-secondary-row > a {",
    "    flex-direction: row;",
    "    text-align: left;",
    "    padding: 6px;",
    "    margin: 0;",
    "    border-radius: 0;",
    "    border: 0;",
    "    border-right: 1px solid rgb(49, 51, 49);",
    "    box-shadow: none;",
    "    transform: none;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a:nth-child(4),",
    "  header.top nav.top-nav .top-nav-secondary-row > a:nth-child(2) {",
    "    border-right: 0;",
    "  }",
    "}",

    "@media (prefers-reduced-motion: reduce) {",
    "  a.brand { transition: outline-offset 0.15s; }",
    "  a.brand:hover { transform: none; }",
    "  header.top nav.top-nav { transition: none; }",
    "  header.top .top-brand-cluster-phrase { transition: none; }",
    "}",
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
      '<a class="brand" href="' + WTED_BASE + '/" aria-label="Wysteria Lane home">',
      '<div class="brand-mark"><img src="' +
        IMG_WL +
        '" alt="" width="30" height="30"></div>',
      '<div class="brand-text">',
      '<span class="wl">WTED Radio</span>',
      '<span class="dotorg">Powered by Wysteria Lane</span>',
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
      '<a href="' +
        COMMUNITY_URL +
        '" target="_blank" rel="noopener noreferrer">',
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
      "</div>",
      "</div>",

      '<div class="top-spacer" aria-hidden="true"></div>',

      "</header>",
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

    var self = this;
    this._onToggleClick = function () {
      self._setOpen(!self._navOpen);
    };
    this._onLinkClick = function () {
      self._setOpen(false);
    };
    this._onKey = function (e) {
      if (e.key === "Escape" && self._navOpen) self._setOpen(false);
    };

    this._toggle.addEventListener("click", this._onToggleClick);
    var links = sr.querySelectorAll("header.top a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", this._onLinkClick);
    }
    window.addEventListener("keydown", this._onKey);

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
    if (this._phraseIntervalId) {
      window.clearInterval(this._phraseIntervalId);
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

  customElements.define("wl-header", WlHeader);
})();
