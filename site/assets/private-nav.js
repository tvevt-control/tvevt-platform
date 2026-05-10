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
    <a class="tvevt-private-brand" href="${withKey("/console.html")}">
      <div class="tvevt-private-logo">
        <img src="/assets/brand/tvevt-icon.svg" alt="TVEVT">
      </div>

      <div class="tvevt-private-brand-text">
        <strong>TVEVT</strong>
        <span>${key ? "Private Console Active" : "Governance Console"}</span>
      </div>
    </a>

    <nav class="tvevt-private-links">
      <a class="${activeClass("console.html")}" href="${withKey("/console.html")}">
        Console
      </a>

      <a class="${activeClass("signals.html")}" href="${withKey("/signals.html")}">
        Signals
      </a>

      <a class="${activeClass("execution-log.html")}" href="${withKey("/execution-log.html")}">
        Execution Log
      </a>

      <a class="primary ${activeClass("seal.html")}" href="${withKey("/seal.html")}">
        Create Signal
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
    .tvevt-private-nav{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:18px;
      padding:14px;
      border:1px solid rgba(255,255,255,.12);
      border-radius:28px;
      background:rgba(20,20,22,.78);
      backdrop-filter:blur(14px);
      margin:28px auto;
      max-width:1180px;
      font-family:Arial, Helvetica, sans-serif;
    }

    .tvevt-private-brand{
      display:flex;
      align-items:center;
      gap:14px;
      color:white;
      text-decoration:none;
      min-width:0;
    }

    .tvevt-private-logo{
      width:54px;
      height:54px;
      display:flex;
      align-items:center;
      justify-content:center;
      border:1px solid rgba(255,155,61,.35);
      border-radius:18px;
      background:rgba(255,155,61,.08);
      flex:0 0 auto;
    }

    .tvevt-private-logo img{
      width:30px;
      height:30px;
      display:block;
    }

    .tvevt-private-brand-text strong{
      display:block;
      font-size:23px;
      letter-spacing:-.03em;
      line-height:1;
      color:#fff;
    }

    .tvevt-private-brand-text span{
      display:block;
      margin-top:4px;
      color:#a7a7ad;
      font-size:13px;
    }

    .tvevt-private-links{
      display:flex;
      align-items:center;
      gap:10px;
      flex-wrap:wrap;
      justify-content:flex-end;
    }

    .tvevt-private-links a,
    .tvevt-private-forget{
      color:#fff;
      text-decoration:none;
      padding:11px 14px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,.12);
      background:rgba(255,255,255,.04);
      font-size:14px;
      font-weight:800;
      font-family:Arial, Helvetica, sans-serif;
      cursor:pointer;
      transition:
        background .18s ease,
        border-color .18s ease,
        color .18s ease,
        transform .18s ease;
    }

    .tvevt-private-links a:hover,
    .tvevt-private-forget:hover{
      transform:translateY(-1px);
      border-color:rgba(255,255,255,.24);
    }

    .tvevt-private-links a.active{
      background:rgba(255,155,61,.18);
      border-color:rgba(255,155,61,.55);
      color:#ffbf7a;
    }

    .tvevt-private-links a.primary{
      background:#ff9b3d;
      color:#000;
      border-color:transparent;
      box-shadow:0 12px 30px rgba(255,155,61,.18);
    }

    .tvevt-private-links a.primary.active{
      background:#ff9b3d;
      color:#000;
    }

    .tvevt-private-forget{
      color:#ff9b3d;
      border-color:rgba(255,155,61,.35);
      background:rgba(255,155,61,.06);
    }

    .tvevt-private-forget:hover{
      background:rgba(255,155,61,.12);
    }

    @media(max-width:900px){
      .tvevt-private-nav{
        align-items:flex-start;
        flex-direction:column;
        margin:22px 24px;
      }

      .tvevt-private-links{
        justify-content:flex-start;
      }
    }

    @media(max-width:640px){
      .tvevt-private-links{
        width:100%;
      }

      .tvevt-private-links a,
      .tvevt-private-forget{
        width:100%;
        justify-content:center;
        text-align:center;
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
