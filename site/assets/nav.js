/* TVEVT shared navigation injector
   Canon v2026-03-01

   CANONS / STANDARDS:
   1) Single nav injected from /assets/nav.js (this file)
      Include on every page:
      <script src="/assets/nav.js?v=2026-03-01" defer></script>

   2) Canonical NAV links:
      - Request Access  -> https://leads.tvevt.com/?intent=access   (ALWAYS)
      - Packages        -> /index.html#pricing
      - Architecture    -> /architecture.html
      - About           -> /about.html
      - Book a Call     -> /call.html
      - Console         -> /app.html?x=1
      - Log             -> /log.html?x=1

   3) Brand assets live in /assets/brand/ (repo: site/assets/brand/)
      - tvevt-favicon.svg
      - tvevt-icon.svg
      - tvevt-logo-horizontal.svg
      - tvevt-wordmark.svg

   4) This file also:
      - Prevents duplicate nav injection
      - Hides ONLY legacy TVEVT topbar/header blocks (safe rule)
      - Canonicalizes legacy Request Access links site-wide
      - Redirects /request-access.html to leads (soft-redirect)
*/

(() => {
  const VERSION = "2026-03-01";

  const CANON = {
    requestAccess: "https://leads.tvevt.com/?intent=access",
    links: [
      { key: "packages", label: "Packages", href: "/index.html#pricing" },
      { key: "architecture", label: "Architecture", href: "/architecture.html" },
      { key: "about", label: "About", href: "/about.html" },
      { key: "call", label: "Book a Call", href: "/call.html" },
      { key: "console", label: "Console", href: "/app.html?x=1" },
      { key: "log", label: "Log", href: "/log.html?x=1" },
    ],
    brand: {
      icon: `/assets/brand/tvevt-icon.svg?v=${VERSION}`,
      wordmark: `/assets/brand/tvevt-wordmark.svg?v=${VERSION}`,
      logoHorizontal: `/assets/brand/tvevt-logo-horizontal.svg?v=${VERSION}`,
      favicon: `/assets/brand/tvevt-favicon.svg?v=${VERSION}`,
    },
  };

  // 0) Guard: do not inject twice
  if (document.querySelector("[data-tvevt-nav='1']")) return;

  // 0.1) Soft-redirect legacy request-access page to canonical leads URL
  //      (keeps old links working even if they exist somewhere)
  try {
    const path = (location.pathname || "").toLowerCase();
    if (path.endsWith("/request-access.html") || path === "/request-access") {
      const target = CANON.requestAccess + (location.search || "");
      location.replace(target);
      return;
    }
  } catch (_) {
    // ignore
  }

  // 1) Inject favicon canonically (non-breaking; only adds/updates if possible)
  try {
    const upsertLink = (rel, href, type) => {
      let el = document.querySelector(`link[rel="${rel}"][data-tvevt-favicon="1"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        el.setAttribute("data-tvevt-favicon", "1");
        document.head.appendChild(el);
      }
      if (type) el.setAttribute("type", type);
      el.setAttribute("href", href);
    };
    upsertLink("icon", CANON.brand.favicon, "image/svg+xml");
    upsertLink("shortcut icon", CANON.brand.favicon);
  } catch (_) {
    // ignore
  }

  // 2) Hide legacy header/topbar safely (ONLY if it matches the old structure)
  //    We hide:
  //    - header that contains ".topbar" AND ".nav" (your legacy pattern)
  //    - OR ".topbar" blocks that clearly look like the old nav bar
  const hideLegacy = () => {
    const legacyHeaders = Array.from(document.querySelectorAll("header"));
    for (const h of legacyHeaders) {
      const hasTopbar = !!h.querySelector(".topbar");
      const hasNav = !!h.querySelector(".nav");
      if (hasTopbar && hasNav) {
        h.style.display = "none";
      }
    }

    // Also hide standalone legacy topbars if they exist outside <header>
    const legacyTopbars = Array.from(document.querySelectorAll(".topbar"));
    for (const tb of legacyTopbars) {
      // If it's already inside a hidden header, skip
      if (tb.closest("header") && tb.closest("header").style.display === "none") continue;

      const hasBrand = !!tb.querySelector(".brand") || (tb.innerText || "").toLowerCase().includes("tvevt");
      const hasNav = !!tb.querySelector(".nav");
      if (hasBrand && hasNav) {
        tb.style.display = "none";
      }
    }
  };

  // 3) Minimal styles only for injected nav
  const css = `
    :root{
      --tvevt-stroke: rgba(255,255,255,.12);
      --tvevt-text:#eef2f6;
      --tvevt-muted2: rgba(238,242,246,.56);
      --tvevt-orange1:#ff8a00;
      --tvevt-orange2:#ff4d00;
      --tvevt-shadow: 0 10px 40px rgba(0,0,0,.35);
    }

    .tvevt-nav-wrap{
      max-width:1120px;
      margin:0 auto;
      padding:16px 18px 0;
    }

    .tvevt-header{
      position:sticky;
      top:0;
      z-index:999;
      padding:12px 0;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    .tvevt-topbar{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:14px;
      width:100%;
      padding:14px 14px;
      border:1px solid var(--tvevt-stroke);
      background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
      border-radius: 22px;
      box-shadow: var(--tvevt-shadow);
    }

    .tvevt-brand{
      display:flex;
      align-items:center;
      gap:12px;
      min-width:260px;
      text-decoration:none;
      color: var(--tvevt-text);
    }

    .tvevt-mark{
      width:34px;
      height:34px;
      display:grid;
      place-items:center;
      border-radius: 12px;
      background: rgba(255,255,255,.04);
      border:1px solid rgba(255,255,255,.10);
      overflow:hidden;
    }

    .tvevt-word{
      display:flex;
      flex-direction:column;
      line-height:1.05;
    }
    .tvevt-word b{
      font-size:16px;
      letter-spacing:.7px;
    }
    .tvevt-word span{
      font-size:12px;
      color: var(--tvevt-muted2);
    }

    .tvevt-nav{
      display:flex;
      align-items:center;
      gap:10px;
      flex-wrap:wrap;
      justify-content:flex-end;
    }

    .tvevt-btn{
      appearance:none;
      border:1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.05);
      color: var(--tvevt-text);
      padding:10px 14px;
      border-radius: 999px;
      font-size:13px;
      letter-spacing:.2px;
      cursor:pointer;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      user-select:none;
      transition: transform .12s ease, background .12s ease, border-color .12s ease, box-shadow .12s ease;
      white-space:nowrap;
      text-decoration:none;
    }
    .tvevt-btn:hover{
      transform: translateY(-1px);
      border-color: rgba(255,255,255,.22);
      background: rgba(255,255,255,.07);
    }
    .tvevt-btn:active{ transform: translateY(0px); }

    .tvevt-btn-primary{
      border:1px solid rgba(255,138,0,.35);
      background: linear-gradient(135deg, rgba(255,138,0,.95), rgba(255,77,0,.92));
      color:#1a120a;
      font-weight:900;
      box-shadow: 0 14px 40px rgba(255,138,0,.14);
    }
    .tvevt-btn-primary:hover{
      box-shadow: 0 18px 60px rgba(255,138,0,.18);
    }

    .tvevt-btn-active{
      border-color: rgba(255,138,0,.35);
      background: rgba(255,138,0,.10);
    }

    @media (max-width: 980px){
      .tvevt-brand{ min-width: 0; }
      .tvevt-nav{ justify-content:flex-start; }
      .tvevt-nav-wrap{ padding:12px 12px 0; }
    }
  `;

  const style = document.createElement("style");
  style.setAttribute("data-tvevt-nav-style", "1");
  style.textContent = css;
  document.head.appendChild(style);

  // 4) Build injected nav DOM
  const wrap = document.createElement("div");
  wrap.className = "tvevt-nav-wrap";
  wrap.setAttribute("data-tvevt-nav", "1");

  const header = document.createElement("div");
  header.className = "tvevt-header";

  const topbar = document.createElement("div");
  topbar.className = "tvevt-topbar";

  const brand = document.createElement("a");
  brand.className = "tvevt-brand";
  brand.href = "/index.html";
  brand.setAttribute("aria-label", "TVEVT Home");

  const mark = document.createElement("div");
  mark.className = "tvevt-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.innerHTML = `<img src="${CANON.brand.icon}" alt="" width="22" height="22" style="display:block;opacity:.95">`;

  const word = document.createElement("div");
  word.className = "tvevt-word";
  word.innerHTML = `<b>TVEVT</b><span>Governance Console</span>`;

  brand.appendChild(mark);
  brand.appendChild(word);

  const nav = document.createElement("nav");
  nav.className = "tvevt-nav";
  nav.setAttribute("aria-label", "Top navigation");

  // Helper: determine active link by pathname
  const pathname = (() => {
    try { return (location.pathname || "/").toLowerCase(); } catch { return "/"; }
  })();

  const isActive = (href) => {
    // Packages is special: /index.html#pricing should be active only on index
    if (href.startsWith("/index.html#pricing")) {
      return pathname === "/" || pathname.endsWith("/index.html");
    }
    // Match pathname for other internal pages
    try {
      const u = new URL(href, location.origin);
      return (u.pathname || "").toLowerCase() === pathname;
    } catch (_) {
      return false;
    }
  };

  // Normal links
  for (const l of CANON.links) {
    const a = document.createElement("a");
    a.className = "tvevt-btn";
    a.href = l.href;
    a.textContent = l.label;
    if (isActive(l.href)) a.className += " tvevt-btn-active";
    nav.appendChild(a);
  }

  // Request Access (canonical, ALWAYS external)
  const access = document.createElement("a");
  access.className = "tvevt-btn tvevt-btn-primary";
  access.href = CANON.requestAccess;
  access.textContent = "Request Access";
  access.target = "_blank";
  access.rel = "noopener";
  nav.appendChild(access);

  topbar.appendChild(brand);
  topbar.appendChild(nav);
  header.appendChild(topbar);
  wrap.appendChild(header);

  // 5) Insert injected nav at top of body
  const mount = () => {
    hideLegacy();
    if (document.body.firstChild) {
      document.body.insertBefore(wrap, document.body.firstChild);
    } else {
      document.body.appendChild(wrap);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }

  // 6) Canonicalize legacy Request Access links site-wide
  //    This fixes buttons inside pages WITHOUT rewriting all HTML files.
  //    Converts:
  //      /request-access.html
  //      /request-access.html?x=1
  //      request-access.html
  //      request-access.html?...
  //    -> https://leads.tvevt.com/?intent=access
  try {
    const rewriteLegacyAccessLinks = () => {
      const anchors = document.querySelectorAll("a[href]");
      anchors.forEach((a) => {
        const href = (a.getAttribute("href") || "").trim();
        if (!href) return;

        const h = href.toLowerCase();

        const legacy =
          h === "/request-access.html" ||
          h.startsWith("/request-access.html?") ||
          h === "request-access.html" ||
          h.startsWith("request-access.html?");

        if (legacy) {
          a.setAttribute("href", CANON.requestAccess);
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener");
        }
      });
    };

    // run now + after a short delay (for pages that render content after load)
    rewriteLegacyAccessLinks();
    setTimeout(rewriteLegacyAccessLinks, 250);
    setTimeout(rewriteLegacyAccessLinks, 1200);
  } catch (_) {
    // ignore
  }
})();
