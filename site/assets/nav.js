/* TVEVT shared navigation injector
   Canon v2026-03-01
   - Single nav injected from /assets/nav.js
   - Canonical Request Access: https://leads.tvevt.com/?intent=access
   - Brand assets from /assets/brand/
*/

(() => {
  const CANON = {
    requestAccess: "https://leads.tvevt.com/?intent=access",
    links: [
      { label: "Packages", href: "/index.html#pricing" },
      { label: "Architecture", href: "/architecture.html" },
      { label: "About", href: "/about.html" },
      { label: "Book a Call", href: "/call.html" },
      { label: "Console", href: "/app.html?x=1" },
      { label: "Log", href: "/log.html?x=1" },
    ],
  };

  // 0) Helper: build canonical access URL with optional plan param from old links
  function buildAccessUrlFromOldHref(oldHref) {
    try {
      // Make it absolute so URL() can parse
      const u = new URL(oldHref, window.location.origin);

      // Extract plan if present in old href (e.g. ?plan=control)
      const plan = u.searchParams.get("plan");
      const x = u.searchParams.get("x");

      // Start from canonical
      const canon = new URL(CANON.requestAccess);

      // Preserve plan if it exists (optional, harmless)
      if (plan) canon.searchParams.set("plan", plan);

      // If you ever used x=1 as demo flag, we intentionally DROP it
      // because it is not part of canon.

      return canon.toString();
    } catch (e) {
      return CANON.requestAccess;
    }
  }

  // 1) Rewrite ALL request-access links on the page to canonical
  function canonicalizeAccessLinks(root = document) {
    const anchors = root.querySelectorAll("a[href]");
    anchors.forEach(a => {
      const href = a.getAttribute("href") || "";

      // match:
      // /request-access
      // /request-access.html
      // request-access.html?...
      // request-access?...
      const normalized = href.toLowerCase();

      const isLegacy =
        normalized.includes("/request-access") ||
        normalized.includes("request-access.html") ||
        normalized === "request-access" ||
        normalized === "request-access.html";

      if (!isLegacy) return;

      // Do not touch if it's already the canonical external URL
      if (href.startsWith(CANON.requestAccess)) return;

      a.setAttribute("href", buildAccessUrlFromOldHref(href));
      // Open in same tab (keep normal). If you want new tab, uncomment:
      // a.setAttribute("target", "_blank");
      // a.setAttribute("rel", "noopener");
    });
  }

  // 2) Guard: do not inject twice
  if (document.querySelector("[data-tvevt-nav='1']")) {
    // still run link canonicalization in case page changed
    canonicalizeAccessLinks();
    return;
  }

  // 3) Hide legacy headers/nav to prevent duplicates (SAFE, conservative)
  function hideLegacyNavIfPresent() {
    const header = document.querySelector("header");
    if (!header) return;

    const txt = (header.innerText || "").toLowerCase();
    const looksLikeTvevt =
      txt.includes("tvevt") &&
      (txt.includes("packages") || txt.includes("architecture") || txt.includes("request"));

    if (looksLikeTvevt) {
      header.style.display = "none";
      return;
    }

    // fallback: hide common blocks only if they contain "Request Access"
    const topbar = document.querySelector(".topbar");
    if (topbar && (topbar.innerText || "").toLowerCase().includes("request")) {
      topbar.style.display = "none";
    }
  }

  hideLegacyNavIfPresent();

  // 4) Minimal styles (only for injected nav)
  const css = `
    :root{
      --tvevt-stroke: rgba(255,255,255,.12);
      --tvevt-text:#eef2f6;
      --tvevt-muted2: rgba(238,242,246,.56);
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
      box-shadow: 0 10px 40px rgba(0,0,0,.35);
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

  // 5) Build injected nav DOM
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
  mark.innerHTML = `<img src="/assets/brand/tvevt-icon.svg?v=2026-03-01" alt="" width="22" height="22" style="display:block;opacity:.95">`;

  const word = document.createElement("div");
  word.className = "tvevt-word";
  word.innerHTML = `<b>TVEVT</b><span>Governance Console</span>`;

  brand.appendChild(mark);
  brand.appendChild(word);

  const nav = document.createElement("nav");
  nav.className = "tvevt-nav";
  nav.setAttribute("aria-label", "Top navigation");

  for (const l of CANON.links) {
    const a = document.createElement("a");
    a.className = "tvevt-btn";
    a.href = l.href;
    a.textContent = l.label;
    nav.appendChild(a);
  }

  const access = document.createElement("a");
  access.className = "tvevt-btn tvevt-btn-primary";
  access.href = CANON.requestAccess;
  access.textContent = "Request Access";
  nav.appendChild(access);

  topbar.appendChild(brand);
  topbar.appendChild(nav);
  header.appendChild(topbar);
  wrap.appendChild(header);

  // 6) Insert at top of body
  if (document.body.firstChild) {
    document.body.insertBefore(wrap, document.body.firstChild);
  } else {
    document.body.appendChild(wrap);
  }

  // 7) Canonicalize links now + after DOM fully ready
  canonicalizeAccessLinks();
  document.addEventListener("DOMContentLoaded", () => canonicalizeAccessLinks());
})();
