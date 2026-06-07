(function () {
  const params = new URLSearchParams(window.location.search);
  const urlKey = params.get("key");

  let key =
    urlKey ||
    localStorage.getItem("tvevt_client_key") ||
    "";

  if (key) {
    localStorage.setItem("tvevt_client_key", key);
  }

  function withKey(path) {
    if (!key) return path;
    return path + "?key=" + encodeURIComponent(key);
  }

  function activeClass(page) {
    const current = window.location.pathname;
    return current.endsWith(page) ? "active" : "";
  }

  function forgetAccess() {
    const confirmed = window.confirm(
      "Forget TVEVT private access on this device?"
    );
    if (!confirmed) return;

    localStorage.removeItem("tvevt_client_key");
    window.location.href = "/request-access.html";
  }

  const nav = document.createElement("header");
  nav.className = "tvevt-private-nav";

  nav.innerHTML = `
    <a class="tvevt-private-brand" href="/">
      <div class="tvevt-private-logo">
        <img src="/assets/brand/tvevt-icon.svg" alt="TVEVT">
      </div>
      <div class="tvevt-private-brand-text">
        <strong>TVEVT</strong>
        <span>Governance Console</span>
      </div>
    </a>

    <nav class="tvevt-private-links">
      <a class="${activeClass("console.html")}" href="${withKey("/console.html")}">
        Console
      </a>
      <a class="${activeClass("signals.html")}" href="${withKey("/signals.html")}">
        Archive
      </a>
      <a class="${activeClass("execution-log.html")}" href="${withKey("/execution-log.html")}">
        Execution Log
      </a>
      <a class="primary ${activeClass("seal.html")}" href="${withKey("/seal.html")}">
        Create Record
      </a>
      <a href="/">
        Public Site
      </a>
      ${
        key
          ? `
            <button
              class="tvevt-private-forget"
              type="button"
              id="tvevtForgetAccess"
            >
              Forget Access
            </button>
          `
          : `
            <a href="/request-access.html">
              Request Access
            </a>
          `
      }
    </nav>
  `;

  const style = document.createElement("style");
  style.textContent = `
    .tvevt-private-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 14px 24px;
      border: 1px solid #30363D;
      border-radius: 8px;
      background: #161B22;
      backdrop-filter: blur(14px);
      margin: 28px auto;
      max-width: 1180px;
      font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .tvevt-private-brand {
      display: flex;
      align-items: center;
      gap: 14px;
      color: #F0F6FC;
      text-decoration: none;
      min-width: 0;
    }

    .tvevt-private-logo {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(240, 246, 252, 0.15);
      border-radius: 6px;
      background: rgba(240, 246, 252, 0.02);
      flex: 0 0 auto;
    }

    .tvevt-private-logo img {
      width: 24px;
      height: 24px;
      display: block;
    }

    .tvevt-private-brand-text strong {
      display: block;
      font-size: 20px;
      letter-spacing: -.02em;
      line-height: 1;
      color: #F0F6FC;
      font-weight: 500;
    }

    .tvevt-private-brand-text span {
      display: block;
      margin-top: 4px;
      color: #8B949E;
      font-size: 12px;
      font-family: "JetBrains Mono", monospace;
    }

    .tvevt-private-links {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .tvevt-private-links a,
    .tvevt-private-forget {
      color: #F0F6FC;
      text-decoration: none;
      padding: 10px 16px;
      border-radius: 6px;
      border: 1px solid #30363D;
      background: #21262D;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: background .15s ease, border-color .15s ease, color .15s ease;
    }

    .tvevt-private-links a:hover,
    .tvevt-private-forget:hover {
      border-color: #F0F6FC;
      background: #30363D;
    }

    /* ФИКС СТИЛЕЙ: Универсальная подсветка активной вкладки */
    .tvevt-private-links a.active {
      background: rgba(240, 246, 252, 0.1) !important;
      border-color: #F0F6FC !important;
      color: #F0F6FC !important;
    }

    .tvevt-private-links a.primary {
      background: transparent;
      color: #F0F6FC;
      border-color: #30363D;
    }

    .tvevt-private-links a.primary:hover {
      background: #21262D;
      border-color: #F0F6FC;
    }

    .tvevt-private-forget {
      color: #FF4D4D;
      border-color: rgba(255, 77, 77, 0.2);
      background: rgba(255, 77, 77, 0.02);
    }

    .tvevt-private-forget:hover {
      background: rgba(255, 77, 77, 0.08);
      border-color: #FF4D4D;
    }

    @media(max-width:900px){
      .tvevt-private-nav {
        align-items: flex-start;
        flex-direction: column;
        margin: 22px 24px;
        border-radius: 6px;
      }
      .tvevt-private-links {
        justify-content: flex-start;
        width: 100%;
      }
    }

    @media(max-width:640px){
      .tvevt-private-links a,
      .tvevt-private-forget {
        width: 100%;
        text-align: center;
        justify-content: center;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.insertBefore(nav, document.body.firstChild);

  const forgetBtn = document.getElementById("tvevtForgetAccess");
  if (forgetBtn) {
    forgetBtn.addEventListener("click", forgetAccess);
  }
})();
