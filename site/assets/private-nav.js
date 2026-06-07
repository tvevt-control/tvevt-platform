(function () {
  // Проверяем текущую страницу для точной подсветки активного пункта
  function activeClass(pageName) {
    const current = window.location.pathname;
    const cleanName = pageName.replace(".html", "");
    if (current === "/" && cleanName === "index") return "active";
    return current.includes(cleanName) ? "active" : "";
  }

  const nav = document.createElement("header");
  nav.className = "tvevt-public-nav";

  // СТРОГИЙ ПУБЛИЧНЫЙ СТАНДАРТ: Home | Verify Record | Public Proof | Request Access
  nav.innerHTML = `
    <a class="tvevt-public-brand" href="/">
      <div class="tvevt-public-logo">
        <img src="/assets/brand/tvevt-icon.svg" alt="TVEVT">
      </div>
      <div class="tvevt-public-brand-text">
        <strong>TVEVT</strong>
        <span>Governance Console</span>
      </div>
    </a>

    <nav class="tvevt-public-links">
      <a class="${activeClass("index.html")}" href="/">Home</a>
      <a class="${activeClass("record.html")}" href="/record.html">Verify Record</a>
      <a class="${activeClass("proof.html")}" href="/proof.html">Public Proof</a>
      <a class="primary ${activeClass("request-access.html")}" href="/request-access.html">Request Access</a>
    </nav>
  `;

  const style = document.createElement("style");
  style.textContent = `
    .tvevt-public-nav {
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

    .tvevt-public-brand {
      display: flex;
      align-items: center;
      gap: 14px;
      color: #F0F6FC;
      text-decoration: none;
      min-width: 0;
    }

    .tvevt-public-logo {
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

    .tvevt-public-logo img {
      width: 24px;
      height: 24px;
      display: block;
    }

    .tvevt-public-brand-text strong {
      display: block;
      font-size: 20px;
      letter-spacing: -.02em;
      line-height: 1;
      color: #F0F6FC;
      font-weight: 500;
    }

    .tvevt-public-brand-text span {
      display: block;
      margin-top: 4px;
      color: #8B949E;
      font-size: 12px;
      font-family: "JetBrains Mono", monospace;
    }

    .tvevt-public-links {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .tvevt-public-links a {
      color: #F0F6FC;
      text-decoration: none;
      padding: 10px 16px;
      border-radius: 6px;
      border: 1px solid #30363D;
      background: #21262D;
      font-size: 13px;
      font-weight: 500;
      transition: background .15s ease, border-color .15s ease, color .15s ease;
    }

    .tvevt-public-links a:hover {
      border-color: #F0F6FC;
      background: #30363D;
    }

    .tvevt-public-links a.active {
      background: rgba(240, 246, 252, 0.1) !important;
      border-color: #F0F6FC !important;
      color: #F0F6FC !important;
    }

    .tvevt-public-links a.primary {
      background: transparent;
      border-color: #30363D;
    }

    .tvevt-public-links a.primary:hover {
      background: #21262D;
      border-color: #F0F6FC;
    }

    .tvevt-public-links a.primary.active {
      background: rgba(240, 246, 252, 0.1) !important;
      border-color: #F0F6FC !important;
    }

    @media(max-width:920px){
      .tvevt-public-nav {
        align-items: flex-start;
        flex-direction: column;
        margin: 22px 24px;
        border-radius: 6px;
      }
      .tvevt-public-links {
        justify-content: flex-start;
        width: 100%;
      }
    }

    @media(max-width:640px){
      .tvevt-public-links a {
        width: 100%;
        text-align: center;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.insertBefore(nav, document.body.firstChild);
})();
