(() => {
  "use strict";

  const cfg = {
    api: "/api/security-log",
    allowedHosts: new Set([
      "jesusparakids.vercel.app",
      "localhost",
      "127.0.0.1",
    ]),
  };

  const sendLog = (event, extra = {}) => {
    const payload = JSON.stringify({
      event,
      extra,
      path: location.pathname,
      host: location.hostname,
      ua: navigator.userAgent,
      ts: Date.now(),
    });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(cfg.api, blob);
      } else {
        fetch(cfg.api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
          credentials: "omit",
        }).catch(() => {});
      }
    } catch (_) {}
  };

  const hostAllowed = () => {
    const host = location.hostname.toLowerCase();
    if (cfg.allowedHosts.has(host)) return true;
    if (host.endsWith(".vercel.app")) return true;
    return false;
  };

  if (location.protocol !== "file:" && !hostAllowed()) {
    sendLog("domain_block", { blockedHost: location.hostname });
    document.documentElement.innerHTML = "";
    throw new Error("Blocked by domain policy");
  }

  const rnd = (() => {
    try {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    } catch (_) {
      return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    }
  })();
  document.documentElement.setAttribute("data-session-token", rnd);
  document.documentElement.classList.add("secure-no-select");

  const blockedKey = (ev) => {
    const key = (ev.key || "").toLowerCase();
    const ctrl = ev.ctrlKey || ev.metaKey;
    const combo = ctrl && ev.shiftKey;
    if (
      key === "f12" ||
      (ctrl && ["u", "s", "c", "x", "a"].includes(key)) ||
      (combo && ["i", "j", "c"].includes(key))
    ) {
      ev.preventDefault();
      ev.stopPropagation();
      sendLog("blocked_shortcut", { key: ev.key });
    }
  };

  document.addEventListener("keydown", blockedKey, { capture: true });
  document.addEventListener(
    "contextmenu",
    (ev) => {
      ev.preventDefault();
      sendLog("blocked_contextmenu");
    },
    { capture: true },
  );
  document.addEventListener(
    "copy",
    (ev) => {
      ev.preventDefault();
      sendLog("blocked_copy");
    },
    { capture: true },
  );
  document.addEventListener(
    "dragstart",
    (ev) => {
      const t = ev.target;
      if (t instanceof HTMLImageElement) {
        ev.preventDefault();
        sendLog("blocked_drag_image");
      }
    },
    { capture: true },
  );

  const suspiciousSignals = [];
  if (navigator.webdriver) suspiciousSignals.push("webdriver");
  if (/HeadlessChrome|PhantomJS|puppeteer|playwright|selenium/i.test(navigator.userAgent)) {
    suspiciousSignals.push("headless_ua");
  }
  if (suspiciousSignals.length) {
    document.documentElement.setAttribute("data-risk", "high");
    sendLog("suspicious_client", { signals: suspiciousSignals.join(",") });
  }

  let devtoolsWasOpen = false;
  const detectDevtools = () => {
    const widthGap = Math.abs(window.outerWidth - window.innerWidth);
    const heightGap = Math.abs(window.outerHeight - window.innerHeight);
    const isOpen = widthGap > 160 || heightGap > 160;
    if (isOpen && !devtoolsWasOpen) {
      devtoolsWasOpen = true;
      sendLog("devtools_open");
    } else if (!isOpen && devtoolsWasOpen) {
      devtoolsWasOpen = false;
      sendLog("devtools_close");
    }
  };
  window.setInterval(detectDevtools, 1500);

  const protectImages = () => {
    document.querySelectorAll("img").forEach((img) => {
      img.setAttribute("draggable", "false");
      const parent = img.parentElement;
      if (!parent || parent.dataset.securedImage === "1") return;
      const cs = window.getComputedStyle(parent);
      if (cs.position === "static") parent.style.position = "relative";
      const guard = document.createElement("span");
      guard.setAttribute("aria-hidden", "true");
      guard.style.position = "absolute";
      guard.style.inset = "0";
      guard.style.background = "transparent";
      guard.style.zIndex = "2";
      guard.style.pointerEvents = "auto";
      parent.appendChild(guard);
      parent.dataset.securedImage = "1";
    });
  };

  protectImages();
  const mo = new MutationObserver(() => {
    protectImages();
    if (!document.documentElement.classList.contains("secure-no-select")) {
      document.documentElement.classList.add("secure-no-select");
      sendLog("selection_lock_restored");
    }
  });
  mo.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class"],
  });
})();
