/* TVEVT shared navigation injector
   Canon v2026-03-01
   Single source of truth: /assets/nav.js
   Canonical Request Access: https://leads.tvevt.com/?intent=access
   Brand assets: /assets/brand/
*/

(() => {
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
  };

  // ---------- 1) Canonicalize ANY legacy Request Access links on the page ----------
  function canonicalizeAccessLinks(root = document) {
    const anchors = root.querySelectorAll("a[href]");
    anchors.forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      if (!href) return;

      const h = href.toLowerCase();

      // Legacy patterns we want to eliminate forever
      const isLegacy =
        h === "/request-access" ||
        h === "/request-access.html" ||
        h.startsWith("/request-access?") ||
        h.startsWith("/request-access.html?") ||
        h === "request-access" ||
        h === "request-access.html" ||
        h.startsWith("request-access?") ||
        h.startsWith("request-access.html?");

      if (!isLegacy) return;

      // Replace with canonical external URL
      a.setAttribute("href", CANON.requestAccess);
      // Keep same-tab behavior (canonical). If you want new tab, set target manually in nav only.
      a.removeAttribute("target");
      a.removeAttribute("rel");
    });
  }

  // Run immediately (fixes old footer buttons etc.)
  canonicalizeAccessLinks();
  document.addEventListener("DOMContentLoaded", () => canonicalizeAccessLinks());

  // ---------- 2) Guard: do not inject twice ----------
  if (document.querySelector("[data-tvevt-nav='1']")) return;

  // ---------- 3) Hide legacy header/topbar (conservative) ----------
  function hideLegacyIfItLooksLikeSiteNav() {
    const header = document.querySelector("header");
    if (header) {
      const t = (header.innerText || "").toLowerCase();
      const looksLike =
        t.includes("tvevt") &&
        (t.includes("packages") || t.includes("architecture") || t.includes("request access") || t.includes("request"));
      if (looksLike) header.style.display = "none";
    }

    // Also hide obvious legacy blocks if present
    const topbar = document.querySelector(".topbar");
    if (topbar) {
      const t2 = (topbar.innerText || "").toLowerCase();
      if (t2.includes("packages") || t2.includes("request")) topbar.style.display = "none";
    }
  }
  hideLegacyIfItLooksLikeSiteNav();

  // ---------- 4) Inject styles ----------
  const css = `
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
      border:1px solid rgba(255,255,255,.12);
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
      color:#eef2f6;
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
      color: rgba(238,242,246,.56);
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
      color:#eef2f6;
      padding:10px 14px;
      border-radius: 999px;
      font-size:13px;
      letter-spacing:.2px;
      cursor:pointer;
      display:inline-flex;
      align-items:center;
      justify-content:center;
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
    .tvevt-btn-active{
      border-color: rgba(255,138,0,.35);
      background: rgba(255,138,0,.10);
    }
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

  // ---------- 5) Build nav DOM ----------
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

  // active detection (simple + stable)
  const path = (window.location.pathname || "").toLowerCase();

  function isActiveLink(href) {
    // only mark active for same-page anchors and same pathname pages
    const target = href.split("#")[0].toLowerCase();
    if (target === "/index.html" || target === "/index.html#pricing") {
      return path === "/" || path.endsWith("/index.html");
    }
    return target && path.endsWith(target);
  }

  for (const l of CANON.links) {
    const a = document.createElement("a");
    a.className = "tvevt-btn" + (isActiveLink(l.href) ? " tvevt-btn-active" : "");
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

  // ---------- 6) Insert at top of body ----------
  if (document.body.firstChild) {
    document.body.insertBefore(wrap, document.body.firstChild);
  } else {
    document.body.appendChild(wrap);
  }

  // Final safety pass (after inject)
  canonicalizeAccessLinks();
})();
