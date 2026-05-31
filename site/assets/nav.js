/* TVEVT shared navigation injector
   Canon v2026-05-31
   - Unified Alpha header
   - Current working routes only
   - No legacy leads.tvevt.com rewrite
   - No /app.html or /log.html legacy paths
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
    return clientKey
      ? withKey(ROUTES.console)
      : ROUTES.requestAccess;
  }

  function getSealHref() {
    return clientKey
      ? withKey(ROUTES.seal)
      : ROUTES.seal;
  }

  function getSignalsHref() {
    return clientKey
      ? withKey(ROUTES.signals)
      : ROUTES.requestAccess;
  }

  function getExecutionLogHref() {
    return clientKey
      ? withKey(ROUTES.executionLog)
      : ROUTES.requestAccess;
  }

  function normalizeLegacyLinks(root = document) {
    const anchors = root.querySelectorAll("a[href]");

    anchors.forEach((a) => {
      const href =
        (a.getAttribute("href") || "").trim();

      if (!href) return;

      const lower =
        href.toLowerCase();

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

      if (
        lower.includes("/app.html") ||
        lower.includes("app.html?x=1")
      ) {
        a.setAttribute("href", getConsoleHref());
      }

      if (
        lower.includes("/log.html") ||
        lower.includes("log.html?x=1")
      ) {
        a.setAttribute("href", getExecutionLogHref());
      }
    });
  }

  if (document.querySelector("[data-tvevt-nav='1']")) {
    normalizeLegacyLinks();
    document.addEventListener(
      "DOMContentLoaded",
      () => normalizeLegacyLinks()
    );
    return;
  }

  function hideLegacyHeaderIfPresent() {
    const headers =
      document.querySelectorAll("header");

    headers.forEach((header) => {
      if (header.closest("[data-tvevt-nav='1']")) {
        return;
      }

      const text =
        (header.innerText || "").toLowerCase();

      const looksLikeTvevt =
        text.includes("tvevt") ||
        text.includes("request access") ||
        text.includes("verify record") ||
        text.includes("console");

      if (looksLikeTvevt) {
        header.style.display = "none";
      }
    });
  }

  hideLegacyHeaderIfPresent();

  const css = `
    :root{
      --tvevt-nav-bg: rgba(18,18,20,.82);
      --tvevt-nav-panel: rgba(255,255,255,.035);
      --tvevt-nav-line: rgba(255,255,255,.10);
      --tvevt-nav-text: rgba(255,255,255,.92);
      --tvevt-nav-muted: rgba(255,255,255,.52);
      --tvevt-nav-orange: #ff9b3d;
      --tvevt-nav-orange2: #ff7b1c;
    }

    .tvevt-nav-shell{
      width:100%;
      position:sticky;
      top:0;
      z-index:999;
      padding:18px 18px 0;
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
      gap:18px;
      padding:14px 18px;
      border:1px solid var(--tvevt-nav-line);
      border-radius:24px;
      background:var(--tvevt-nav-bg);
      backdrop-filter:blur(16px);
      -webkit-backdrop-filter:blur(16px);
      box-shadow:0 12px 36px rgba(0,0,0,.26);
    }

    .tvevt-nav-brand{
      display:flex;
      align-items:center;
      gap:14px;
      min-width:210px;
      color:var(--tvevt-nav-text);
      text-decoration:none;
    }

    .tvevt-nav-mark{
      width:46px;
      height:46px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:14px;
      border:1px solid rgba(255,155,61,.28);
      background:linear-gradient(
        180deg,
        rgba(255,155,61,.10),
        rgba(255,155,61,.04)
      );
      flex:0 0 auto;
    }

    .tvevt-nav-mark img{
      width:23px;
      height:23px;
      display:block;
    }

    .tvevt-nav-word{
      display:flex;
      flex-direction:column;
      line-height:1.05;
    }

    .tvevt-nav-word strong{
      display:block;
      font-size:20px;
      font-weight:700;
      letter-spacing:-.035em;
      color:var(--tvevt-nav-text);
    }

    .tvevt-nav-word span{
      display:block;
      margin-top:4px;
      font-size:12px;
      font-weight:400;
      color:var(--tvevt-nav-muted);
    }

    .tvevt-nav-links{
      display:flex;
      align-items:center;
      justify-content:flex-end;
      gap:9px;
      flex-wrap:wrap;
    }

    .tvevt-nav-link{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:40px;
      padding:10px 14px;
      border:1px solid var(--tvevt-nav-line);
      border-radius:999px;
      background:var(--tvevt-nav-panel);
      color:var(--tvevt-nav-text);
      text-decoration:none;
      font-size:13px;
      font-weight:500;
      letter-spacing:-.01em;
      white-space:nowrap;
      transition:
        border-color .15s ease,
        background .15s ease,
        transform .12s ease,
        color .15s ease;
    }

    .tvevt-nav-link:hover{
      transform:translateY(-1px);
      border-color:rgba(255,155,61,.34);
      background:rgba(255,255,255,.055);
      color:#fff;
    }

    .tvevt-nav-primary{
      border-color:rgba(255,155,61,.38);
      background:linear-gradient(
        135deg,
        var(--tvevt-nav-orange),
        var(--tvevt-nav-orange2)
      );
      color:#140800;
      font-weight:650;
    }

    .tvevt-nav-primary:hover{
      border-color:rgba(255,155,61,.55);
      background:linear-gradient(
        135deg,
        var(--tvevt-nav-orange),
        var(--tvevt-nav-orange2)
      );
      color:#140800;
    }

    @media(max-width:980px){
      .tvevt-nav-shell{
        padding:14px 12px 0;
      }

      .tvevt-nav-bar{
        flex-direction:column;
        align-items:flex-start;
      }

      .tvevt-nav-brand{
        min-width:0;
      }

      .tvevt-nav-links{
        width:100%;
        justify-content:flex-start;
      }

      .tvevt-nav-link{
        flex:1 1 auto;
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
        grid-column:1 / -1;
      }
    }
  `;

  const style =
    document.createElement("style");

  style.setAttribute(
    "data-tvevt-nav-style",
    "1"
  );

  style.textContent = css;

  document.head.appendChild(style);

  const shell =
    document.createElement("div");

  shell.className = "tvevt-nav-shell";
  shell.setAttribute("data-tvevt-nav", "1");

  const inner =
    document.createElement("div");

  inner.className = "tvevt-nav-inner";

  const bar =
    document.createElement("div");

  bar.className = "tvevt-nav-bar";

  const brand =
    document.createElement("a");

  brand.className = "tvevt-nav-brand";
  brand.href = ROUTES.home;
  brand.setAttribute("aria-label", "TVEVT Home");

  const mark =
    document.createElement("div");

  mark.className = "tvevt-nav-mark";

  mark.innerHTML =
    `<img src="/assets/brand/tvevt-icon.svg?v=2026-05-31" alt="">`;

  const word =
    document.createElement("div");

  word.className = "tvevt-nav-word";

  word.innerHTML =
    `<strong>TVEVT</strong><span>Verified Records Infrastructure</span>`;

  brand.appendChild(mark);
  brand.appendChild(word);

  const links =
    document.createElement("nav");

  links.className = "tvevt-nav-links";
  links.setAttribute("aria-label", "TVEVT navigation");

  const navItems = [
    {
      label: "Home",
      href: ROUTES.home
    },
    {
      label: "Verify",
      href: ROUTES.verify
    },
    {
      label: "New Signal",
      href: getSealHref()
    },
    {
      label: "Console",
      href: getConsoleHref()
    },
    {
      label: "Archive",
      href: getSignalsHref()
    },
    {
      label: "Execution Log",
      href: getExecutionLogHref()
    }
  ];

  navItems.forEach((item) => {
    const a =
      document.createElement("a");

    a.className = "tvevt-nav-link";
    a.href = item.href;
    a.textContent = item.label;

    links.appendChild(a);
  });

  const access =
    document.createElement("a");

  access.className =
    "tvevt-nav-link tvevt-nav-primary";

  access.href =
    ROUTES.requestAccess;

  access.textContent =
    "Request Access";

  links.appendChild(access);

  bar.appendChild(brand);
  bar.appendChild(links);
  inner.appendChild(bar);
  shell.appendChild(inner);

  document.body.insertBefore(
    shell,
    document.body.firstChild
  );

  normalizeLegacyLinks();

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      normalizeLegacyLinks();
    }
  );
})();
