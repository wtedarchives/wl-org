/*
 * <wl-header> — embeddable Wysteria Lane / WTED Radio site header.
 *
 * Self-contained custom element (Shadow DOM, no framework runtime, no globals
 * other than the registered tag). Designed to be loaded by the Discourse theme
 * for community.wysterialane.org via a single <script src> tag.
 *
 * Update WTED_BASE when the wtedradio.com cutover happens.
 */
(function () {
  if (typeof window === "undefined") return;
  if (window.customElements && customElements.get("wl-header")) return;

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  /** Origin that hosts wl-org images and pages. Swap to https://wtedradio.com on cutover. */
  var WTED_BASE = "https://wted-org.netlify.app";
  var COMMUNITY_URL = "https://community.wysterialane.org";
  var RADIO_IFRAME_SRC =
    "https://www.coreyterrell.com/assets/external/radio.html";

  var IMG_WL = WTED_BASE + "/WL.png";
  var IMG_WTED = WTED_BASE + "/WTED2.png";
  var IMG_ARCHIVE = WTED_BASE + "/wted-sa-cropped-2.png";

  // --------------------------------------------------------------------------
  // Inline icons (no Phosphor dependency)
  // --------------------------------------------------------------------------

  var ICON_LIST =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<line x1="4" y1="7" x2="20" y2="7"/>' +
    '<line x1="4" y1="12" x2="20" y2="12"/>' +
    '<line x1="4" y1="17" x2="20" y2="17"/></svg>';

  var ICON_X =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<line x1="6" y1="6" x2="18" y2="18"/>' +
    '<line x1="18" y1="6" x2="6" y2="18"/></svg>';

  var ICON_HEART =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 21s-7-4.5-9.5-9.5C1 7.5 4 4 7.5 4c1.8 0 3.4 1 4.5 2.4C13.1 5 14.7 4 16.5 4 20 4 23 7.5 21.5 11.5 19 16.5 12 21 12 21z"/>' +
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
    ":host *, :host *::before, :host *::after {",
    "  box-sizing: border-box;",
    "}",

    /* ---------- Desktop layout ---------- */
    "header.top {",
    "  position: relative; z-index: 5;",
    "  display: grid;",
    "  grid-template-columns: 1fr auto 1fr;",
    '  grid-template-areas: "brand nav radio";',
    "  align-items: center;",
    "  column-gap: 16px;",
    "  padding: 8px 28px;",
    "  border-bottom: 1px solid rgb(34, 37, 35);",
    "}",
    "header.top .top-embed-row {",
    "  grid-area: radio;",
    "  justify-self: end;",
    "  min-width: 0;",
    "}",
    "header.top .top-embed-row .radio-embed-wrap--header {",
    "  width: min(300px, 38vw);",
    "  min-width: 200px;",
    "}",
    "header.top .top-mobile-nav-toggle { display: none; }",
    "header.top .top-brand-cluster {",
    "  grid-area: brand;",
    "  justify-self: start;",
    "  display: flex;",
    "  align-items: center;",
    "  gap: 12px;",
    "  min-width: 0;",
    "}",
    "header.top nav.top-nav {",
    "  grid-area: nav;",
    "  justify-self: center;",
    "}",

    /* ---------- Brand ---------- */
    "a.brand {",
    "  display: flex;",
    "  align-items: center;",
    "  gap: 12px;",
    "  text-decoration: none;",
    "  color: inherit;",
    "  border-radius: 12px;",
    "  transform-origin: left center;",
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

    /* ---------- Nav (desktop) ---------- */
    "nav.top-nav { display: flex; flex-direction: row; align-items: center; flex-wrap: wrap; gap: 6px; }",
    "nav.top-nav .top-nav-primary-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }",
    "nav.top-nav .top-nav-primary-row > a {",
    "  display: inline-flex;",
    "  align-items: center;",
    "  gap: 6px;",
    "  font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.8);",
    "  text-decoration: none; padding: 8px 12px; border-radius: 8px;",
    "  transition: color .15s, background .15s;",
    "}",
    "nav.top-nav .top-nav-primary-row > a:hover { color: #fff; background: rgba(255,255,255,0.06); }",
    "nav.top-nav .top-nav-primary-icon { flex-shrink: 0; width: 18px; height: 18px; opacity: 0.92; }",
    "nav.top-nav .top-nav-primary-icon.top-nav-primary-icon--img {",
    "  display: inline-flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  width: 22px;",
    "  height: 22px;",
    "  opacity: 1;",
    "}",
    "nav.top-nav .top-nav-primary-img { width: 100%; height: 100%; object-fit: contain; }",
    "nav.top-nav .top-nav-primary-icon svg { width: 100%; height: 100%; display: block; }",

    /* ---------- Mobile menu toggle ---------- */
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

    /* ---------- Radio iframe ---------- */
    ".radio-embed {",
    "  width: 100%;",
    "  height: 66px;",
    "  border: 0;",
    "  border-radius: 6px;",
    "  display: block;",
    "}",

    /* ---------- Below 1344px: stacked header + drawer nav ---------- */
    "@media (max-width: 1343px) {",
    "  header.top {",
    "    grid-template-columns: minmax(0,1fr) auto minmax(0,1fr);",
    "    grid-template-rows: auto auto auto;",
    '    grid-template-areas: "radio radio radio" "menu brand spacer" "drawer drawer drawer";',
    "    row-gap: 0;",
    "    column-gap: 10px;",
    "    padding: 8px;",
    "  }",
    "  header.top .top-embed-row {",
    "    grid-area: radio;",
    "    justify-self: stretch;",
    "    width: 100%;",
    "    margin-bottom: 10px;",
    "  }",
    "  header.top .top-embed-row .radio-embed-wrap--header {",
    "    width: 100%;",
    "    min-width: 0;",
    "  }",
    "  header.top .top-mobile-nav-toggle {",
    "    display: inline-flex;",
    "    grid-area: menu;",
    "    justify-self: start;",
    "    align-self: center;",
    "  }",
    "  header.top .top-brand-cluster {",
    "    grid-area: brand;",
    "    justify-self: center;",
    "  }",
    "  header.top .top-spacer { grid-area: spacer; }",
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
    "    border-top: 1px solid rgb(39,42,40);",
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
    "    grid-template-columns: repeat(4, minmax(0,1fr));",
    "    gap: 8px;",
    "    align-items: stretch;",
    "    width: 100%;",
    "  }",
    "  header.top nav.top-nav.top-nav--mobile-open {",
    "    max-height: 160px;",
    "    opacity: 1;",
    "    margin-top: 10px;",
    "    padding-top: 10px;",
    "    padding-bottom: 6px;",
    "    pointer-events: auto;",
    "  }",
    "  header.top:has(nav.top-nav.top-nav--mobile-open) {",
    "    padding-bottom: 0;",
    "    border-bottom: 0;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-row > a {",
    "    display: inline-flex;",
    "    flex-direction: column;",
    "    align-items: center;",
    "    justify-content: center;",
    "    gap: 4px;",
    "    text-align: center;",
    "    min-width: 0;",
    "    padding: 10px 6px;",
    "    border-radius: 10px;",
    "    font-size: 11px;",
    "    font-weight: 500;",
    "    line-height: 1.15;",
    "    background: rgba(255,255,255,0.07);",
    "    border: 1px solid rgb(49,51,49);",
    "    transition: background 0.18s, border-color 0.18s, color 0.15s, transform 0.18s;",
    "  }",
    "  header.top nav.top-nav .top-nav-primary-icon { width: 16px; height: 16px; }",
    "  header.top nav.top-nav .top-nav-primary-icon.top-nav-primary-icon--img { width: 20px; height: 20px; }",
    "  header.top nav.top-nav .top-nav-primary-row > a:hover {",
    "    background: rgba(88,200,174,0.18);",
    "    border-color: rgb(52,109,95);",
    "    color: #fff;",
    "    transform: translateY(-1px);",
    "  }",
    "}",

    "@media (prefers-reduced-motion: reduce) {",
    "  a.brand { transition: outline-offset 0.15s; }",
    "  a.brand:hover { transform: none; }",
    "  header.top nav.top-nav { transition: none; }",
    "}",
  ].join("\n");

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

      '<button type="button" class="top-mobile-nav-toggle" aria-expanded="false" aria-controls="wl-header-mobile-nav" aria-label="Open site menu">',
      '<span class="top-mobile-nav-icon icon-list">' + ICON_LIST + "</span>",
      '<span class="top-mobile-nav-icon icon-x" style="display:none">' +
        ICON_X +
        "</span>",
      "</button>",

      '<div class="top-brand-cluster">',
      '<a class="brand" href="' +
        COMMUNITY_URL +
        '" aria-label="Wysteria Lane home">',
      '<div class="brand-mark"><img src="' +
        IMG_WL +
        '" alt="" width="26" height="26"></div>',
      '<div class="brand-text">',
      '<span class="wl">WTED Radio</span>',
      '<span class="dotorg">Powered by Wysteria Lane</span>',
      "</div>",
      "</a>",
      "</div>",

      '<div class="top-spacer" aria-hidden="true"></div>',

      '<nav id="wl-header-mobile-nav" class="top-nav" aria-label="Primary">',
      '<div class="top-nav-primary-row">',
      '<a href="' +
        WTED_BASE +
        '">' +
        '<span class="top-nav-primary-icon top-nav-primary-icon--img"><img class="top-nav-primary-img" src="' +
        IMG_WTED +
        '" alt=""></span>' +
        "Radio</a>",
      '<a href="' +
        COMMUNITY_URL +
        '">' +
        '<span class="top-nav-primary-icon top-nav-primary-icon--img"><img class="top-nav-primary-img" src="' +
        IMG_WL +
        '" alt=""></span>' +
        "Community</a>",
      '<a href="' +
        WTED_BASE +
        '/archive">' +
        '<span class="top-nav-primary-icon top-nav-primary-icon--img"><img class="top-nav-primary-img" src="' +
        IMG_ARCHIVE +
        '" alt=""></span>' +
        "Archives</a>",
      '<a href="' +
        WTED_BASE +
        '/support">' +
        '<span class="top-nav-primary-icon">' +
        ICON_HEART +
        "</span>" +
        "Support</a>",
      "</div>",
      "</nav>",

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
    var links = sr.querySelectorAll("nav.top-nav a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", this._onLinkClick);
    }
    window.addEventListener("keydown", this._onKey);
  };

  WlHeader.prototype.disconnectedCallback = function () {
    if (this._toggle && this._onToggleClick) {
      this._toggle.removeEventListener("click", this._onToggleClick);
    }
    if (this._onKey) {
      window.removeEventListener("keydown", this._onKey);
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
