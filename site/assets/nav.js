/* TVEVT shared navigation injector
   Canon v2026-05-31-v2
   - Refined unified Alpha header
   - Lighter institutional typography
   - Current working routes only
   - No legacy leads.tvevt.com rewrite
*/

(() => {
  const ROUTES = {
    home: "/",
    verify: "/record.html",
    seal: "/seal.html",
    console: "/console.html",
    signals: "/signals.html",
    executionLog: "/execution-log.html",
    requestAccess: "/request-access.html"
  };

  const clientKey =
    localStorage.getItem("tvevt_client_key") || "";

  function withKey(path) {
    return clientKey
      ? path + "?key=" + encodeURIComponent(clientKey)
      : path;
  }

  function getConsoleHref() {
    return clientKey ? withKey(ROUTES.console) : ROUTES.requestAccess;
  }

  function getSealHref() {
    return clientKey ? withKey(ROUTES.seal) : ROUTES.seal;
  }

  function getSignalsHref() {
    return clientKey ? withKey(ROUTES.signals) : ROUTES.requestAccess;
  }

  function getExecutionLogHref() {
    return clientKey ? withKey(ROUTES.executionLog) : ROUTES.requestAccess;
  }

  function normalizeLegacyLinks(root = document) {
    root.querySelectorAll("a[href]").forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      const lower = href.toLowerCase();

      if (!href) return;

      if (
        lower.includes("leads.tvevt.com") ||
        lower.includes("/request-access") ||
        lower.includes("request-access.html")
      ) {
        a.setAttribute("href", ROUTES.requestAccess);
        a.removeAttribute("target");
        a.removeAttribute("rel");
        a.removeAttribute("onclick");
      }

      if (lower.includes("/app.html")) {
        a.setAttribute("href", getConsoleHref());
      }

      if (lower.includes("/log.html")) {
        a.setAttribute("href", getExecutionLogHref());
      }
    });
  }

  if (document.querySelector("[data-tvevt-nav='1']")) {
    normalizeLegacyLinks();
    document.addEventListener("DOMContentLoaded", () => normalizeLegacyLinks());
    return;
  }

  function hideLegacyHeaders() {
    document.querySelectorAll("header").forEach((header) => {
      if (header.closest("[data-tvevt-nav='1']")) return;

      const text = (header.innerText || "").toLowerCase();

      const looksLikeTvevt =
        text.includes("tvevt") ||
        text.includes("verify") ||
        text.includes("request access") ||
        text.includes("console") ||
        text.includes("execution log");

      if (looksLikeTvevt) {
        header.style.display = "none";
      }
    });
  }

  hideLegacyHeaders();

  const css = `
    :root{
      --tv-bg: rgba(9,9,11,.74);
      --tv-line: rgba(255,255,255,.095);
      --tv-line-soft: rgba(255,255,255,.065);
      --tv-text: rgba(255,255,255,.92);
      --tv-muted: rgba(255,255,255,.52);
      --tv-orange: #ff9b3d;
      --tv-orange2: #ff7b1c;
    }

    .tvevt-nav-shell{
      width:100%;
      position:sticky;
      top:0;
      z-index:9999;
      padding:18px 22px 0;
      pointer-events:none;
    }

    .tvevt-nav-inner{
      max-width:1180px;
      margin:0 auto;
      pointer-events:auto;
    }

    .tvevt-nav-bar{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:24px;
      min-height:64px;
      padding:10px 12px 10px 16px;
      border:1px solid var(--tv-line);
      border-radius:18px;
      background:linear-gradient(
        180deg,
        rgba(18,18,20,.82),
        rgba(12,12,14,.76)
      );
      backdrop-filter:blur(18px);
      -webkit-backdrop-filter:blur(18px);
      box-shadow:
        0 10px 36px rgba(0,0,0,.22),
        inset 0 1px 0 rgba(255,255,255,.035);
    }

    .tvevt-nav-brand{
      display:flex;
      align-items:center;
      gap:12px;
      min-width:250px;
      color:var(--tv-text);
      text-decoration:none;
    }

    .tvevt-nav-mark{
      width:42px;
      height:42px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:12px;
      border:1px solid rgba(255,155,61,.24);
      background:linear-gradient(
        180deg,
        rgba(255,155,61,.095),
        rgba(255,155,61,.03)
      );
      flex:0 0 auto;
    }

    .tvevt-nav-mark img{
      width:22px;
      height:22px;
      display:block;
    }

    .tvevt-nav-word{
      display:flex;
      flex-direction:column;
      line-height:1.05;
    }

    .tvevt-nav-word strong{
      display:block;
      color:var(--tv-text);
      font-size:18px;
      font-weight:650;
      letter-spacing:-.035em;
    }

    .tvevt-nav-word span{
      display:block;
      margin-top:4px;
      color:var(--tv-muted);
      font-size:11.5px;
      font-weight:400;
      letter-spacing:-.01em;
    }

    .tvevt-nav-links{
      display:flex;
      align-items:center;
      justify-content:flex-end;
      gap:4px;
      flex-wrap:wrap;
    }

    .tvevt-nav-link{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:38px;
      padding:9px 12px;
      border:1px solid transparent;
      border-radius:999px;
      background:transparent;
      color:var(--tv-muted);
      text-decoration:none;
      font-size:13px;
      font-weight:500;
      letter-spacing:-.015em;
      white-space:nowrap;
      transition:
        color .15s ease,
        border-color .15s ease,
        background .15s ease,
        transform .12s ease;
    }

    .tvevt-nav-link:hover{
      color:#fff;
      background:rgba(255,255,255,.045);
      border-color:var(--tv-line-soft);
      transform:translateY(-1px);
    }

    .tvevt-nav-link.is-active{
      color:#fff;
      background:rgba(255,255,255,.06);
      border-color:var(--tv-line);
    }

    .tvevt-nav-primary{
      margin-left:6px;
      padding:9px 15px;
      border-color:rgba(255,155,61,.32);
      background:linear-gradient(
        135deg,
        var(--tv-orange),
        var(--tv-orange2)
      );
      color:#140800;
      font-weight:650;
      box-shadow:0 10px 28px rgba(255,155,61,.10);
    }

    .tvevt-nav-primary:hover{
      color:#140800;
      border-color:rgba(255,155,61,.45);
      background:linear-gradient(
        135deg,
        var(--tv-orange),
        var(--tv-orange2)
      );
    }

    @media(max-width:980px){
      .tvevt-nav-shell{
        padding:14px 14px 0;
      }

      .tvevt-nav-bar{
        flex-direction:column;
        align-items:flex-start;
        gap:14px;
      }

      .tvevt-nav-brand{
        min-width:0;
      }

      .tvevt-nav-links{
        width:100%;
        justify-content:flex-start;
        gap:8px;
      }

      .tvevt-nav-link{
        border-color:var(--tv-line-soft);
        background:rgba(255,255,255,.025);
      }
    }

    @media(max-width:640px){
      .tvevt-nav-links{
        display:grid;
        grid-template-columns:1fr 1fr;
      }

      .tvevt-nav-link{
        width:100%;
      }

      .tvevt-nav-primary{
        margin-left:0;
        grid-column:1 / -1;
      }
    }
  `;

  const style = document.createElement("style");
  style.setAttribute("data-tvevt-nav-style", "1");
  style.textContent = css;
  document.head.appendChild(style);

  const currentPath =
    window.location.pathname.replace(/\/$/, "") || "/";

  function isActive(path) {
    const normalized =
      path.replace(/\/$/, "") || "/";

    return currentPath === normalized;
  }

  const shell = document.createElement("div");
  shell.className = "tvevt-nav-shell";
  shell.setAttribute("data-tvevt-nav", "1");

  const inner = document.createElement("div");
  inner.className = "tvevt-nav-inner";

  const bar = document.createElement("div");
  bar.className = "tvevt-nav-bar";

  const brand = document.createElement("a");
  brand.className = "tvevt-nav-brand";
  brand.href = ROUTES.home;
  brand.setAttribute("aria-label", "TVEVT Home");

  const mark = document.createElement("div");
  mark.className = "tvevt-nav-mark";
  mark.innerHTML =
    `<img src="/assets/brand/tvevt-icon.svg?v=2026-05-31" alt="">`;

  const word = document.createElement("div");
  word.className = "tvevt-nav-word";
  word.innerHTML =
    `<strong>TVEVT</strong><span>Verified Records Infrastructure</span>`;

  brand.appendChild(mark);
  brand.appendChild(word);

  const links = document.createElement("nav");
  links.className = "tvevt-nav-links";
  links.setAttribute("aria-label", "TVEVT navigation");

  const navItems = [
    { label: "Home", href: ROUTES.home },
    { label: "Verify", href: ROUTES.verify },
    { label: "New Signal", href: getSealHref() },
    { label: "Console", href: getConsoleHref() },
    { label: "Archive", href: getSignalsHref() },
    { label: "Execution Log", href: getExecutionLogHref() }
  ];

  navItems.forEach((item) => {
    const a = document.createElement("a");
    a.className = "tvevt-nav-link";
    a.href = item.href;
    a.textContent = item.label;

    if (isActive(item.href.split("?")[0])) {
      a.classList.add("is-active");
    }

    links.appendChild(a);
  });

  const access = document.createElement("a");
  access.className = "tvevt-nav-link tvevt-nav-primary";
  access.href = ROUTES.requestAccess;
  access.textContent = "Request Access";

  links.appendChild(access);

  bar.appendChild(brand);
  bar.appendChild(links);
  inner.appendChild(bar);
  shell.appendChild(inner);

  document.body.insertBefore(shell, document.body.firstChild);

  normalizeLegacyLinks();

  document.addEventListener("DOMContentLoaded", () => {
    hideLegacyHeaders();
    normalizeLegacyLinks();
  });
})();
