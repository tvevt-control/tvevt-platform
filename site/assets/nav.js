// site/assets/nav.js
(function () {
  const PATH = (location.pathname || "").toLowerCase();

  // Decide which "Request Access" link is canonical.
  // Option A (recommended): external leads domain (works even if site page changes)
  const REQUEST_ACCESS_HREF = "https://leads.tvevt.com/?intent=access";

  // Mark active tab
  const isActive = (href) => {
    // normalize "call.html" etc
    const h = href.replace(/^\//, "").toLowerCase();
    const p = PATH.replace(/^\//, "");
    if (h.includes("#")) return p === "" || p.startsWith("index.html"); // packages anchor is home
    return p.endsWith(h);
  };

  const navHTML = `
  <header class="tvevt-header">
    <div class="tvevt-topbar">
      <a class="tvevt-brand" href="/index.html" aria-label="TVEVT Home">
        <div class="tvevt-mark" aria-hidden="true">
          <img src="/assets/brand/tvevt-icon.svg" alt="" width="22" height="22">
        </div>
        <div class="tvevt-word">
          <b>TVEVT</b>
          <span>Governance Console</span>
        </div>
      </a>

      <nav class="tvevt-nav" aria-label="Top navigation">
        <a class="tvevt-btn ${isActive("/index.html#pricing") ? "active" : ""}" href="/index.html#pricing">Packages</a>
        <a class="tvevt-btn ${isActive("/architecture.html") ? "active" : ""}" href="/architecture.html">Architecture</a>
        <a class="tvevt-btn ${isActive("/about.html") ? "active" : ""}" href="/about.html">About</a>
        <a class="tvevt-btn ${isActive("/call.html") ? "active" : ""}" href="/call.html">Book a Call</a>
        <a class="tvevt-btn ${isActive("/app.html") ? "active" : ""}" href="/app.html?x=1">Console</a>
        <a class="tvevt-btn ${isActive("/log.html") ? "active" : ""}" href="/log.html?x=1">Log</a>
        <a class="tvevt-btn primary" href="${REQUEST_ACCESS_HREF}" target="_blank" rel="noopener">Request Access</a>
      </nav>
    </div>
  </header>
  `;

  const css = `
  <style>
    .tvevt-header{
      position:sticky; top:0; z-index:50;
      padding:16px 0;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }
    .tvevt-topbar{
      display:flex; align-items:center; justify-content:space-between; gap:14px;
      padding:14px 14px;
      border:1px solid rgba(255,255,255,.12);
      background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
      border-radius: 22px;
      box-shadow: 0 10px 40px rgba(0,0,0,.35);
      max-width:1120px;
      margin:0 auto;
    }
    .tvevt-brand{ display:flex; align-items:center; gap:12px; min-width:260px; color:inherit; text-decoration:none; }
    .tvevt-mark{
      width:34px; height:34px; display:grid; place-items:center;
      border-radius: 12px;
      background: rgba(255,255,255,.04);
      border:1px solid rgba(255,255,255,.10);
    }
    .tvevt-word{ display:flex; flex-direction:column; line-height:1.05; }
    .tvevt-word b{ font-size:16px; letter-spacing:.7px; }
    .tvevt-word span{ font-size:12px; color: rgba(238,242,246,.56); }

    .tvevt-nav{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
    .tvevt-btn{
      border:1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.05);
      color: rgba(238,242,246,.95);
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
      text-decoration:none;
      transition: transform .12s ease, background .12s ease, border-color .12s ease, box-shadow .12s ease;
      white-space:nowrap;
    }
    .tvevt-btn:hover{
      transform: translateY(-1px);
      border-color: rgba(255,255,255,.22);
      background: rgba(255,255,255,.07);
    }
    .tvevt-btn.active{
      border-color: rgba(255,138,0,.35);
      background: rgba(255,138,0,.10);
    }
    .tvevt-btn.primary{
      border:1px solid rgba(255,138,0,.35);
      background: linear-gradient(135deg, rgba(255,138,0,.95), rgba(255,77,0,.92));
      color:#1a120a;
      font-weight:900;
      box-shadow: 0 14px 40px rgba(255,138,0,.14);
    }
    @media (max-width: 980px){
      .tvevt-brand{ min-width:0; }
    }
  </style>`;

  // Insert at top of body
  const mount = document.createElement("div");
  mount.innerHTML = css + navHTML;
  document.body.prepend(mount);
})();
