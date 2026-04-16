(() => {
  const countdownEl = document.getElementById("offer-countdown");
  if (!countdownEl) return;

  const getNextMidnightMs = () => {
    const d = new Date();
    d.setHours(24, 0, 0, 0);
    return d.getTime();
  };

  const formatHms = (msRemaining) => {
    const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");

    return `${hh}:${mm}:${ss}`;
  };

  let endAtMs = getNextMidnightMs();

  const tick = () => {
    const now = Date.now();
    let remaining = endAtMs - now;
    if (remaining <= 0) {
      endAtMs = getNextMidnightMs();
      remaining = endAtMs - now;
    }

    countdownEl.textContent = formatHms(remaining);
  };

  tick();
  window.setInterval(tick, 1000);

  // Scroll Animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll, .fade-in').forEach(el => {
    observer.observe(el);
  });

  const scrollButtons = document.querySelectorAll("[data-scroll-to]");
  scrollButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const selector = btn.getAttribute("data-scroll-to");
      if (!selector) return;
      const target = document.querySelector(selector);
      if (!target) return;

      e.preventDefault();
      btn.classList.add("btn-cta--shimmer");
      window.setTimeout(() => btn.classList.remove("btn-cta--shimmer"), 950);

      target.scrollIntoView({ behavior: "smooth", block: "start" });

      const featured = document.querySelector(".plan-master");
      if (featured) {
        featured.classList.remove("offer-highlight");
        window.setTimeout(() => featured.classList.add("offer-highlight"), 0);
        window.setTimeout(() => featured.classList.remove("offer-highlight"), 1200);
      }
    });
  });

  const upsellModal = document.getElementById("upsell-modal");
  const upsellAccept = document.getElementById("upsell-accept");
  const upsellDecline = document.getElementById("upsell-decline");
  const basicButton = document.querySelector(".btn-essencial");
  const planBasic = document.querySelector(".plan-basic");
  const planMaster = document.querySelector(".plan-master");
  const masterButton = document.querySelector(".plan-master .btn-card.btn-master");

  const openUpsell = () => {
    if (!upsellModal || !upsellAccept || !upsellDecline) return;
    upsellModal.hidden = false;
    document.body.classList.add("modal-open");
    upsellAccept.focus({ preventScroll: true });
  };

  const closeUpsell = () => {
    if (!upsellModal) return;
    upsellModal.hidden = true;
    document.body.classList.remove("modal-open");
  };

  if (basicButton && upsellModal && upsellAccept && upsellDecline) {
    basicButton.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        openUpsell();
      },
      { capture: true },
    );

    upsellAccept.addEventListener("click", () => {
      closeUpsell();
      const target = document.querySelector("#planos");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (planMaster instanceof HTMLElement) {
        planMaster.classList.remove("offer-highlight");
        window.setTimeout(() => planMaster.classList.add("offer-highlight"), 0);
        window.setTimeout(() => planMaster.classList.remove("offer-highlight"), 1200);
      }
      if (masterButton instanceof HTMLButtonElement) masterButton.click();
    });

    upsellDecline.addEventListener("click", () => {
      closeUpsell();
      const target = document.querySelector("#planos");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (planBasic instanceof HTMLElement) {
        planBasic.classList.remove("offer-highlight");
        window.setTimeout(() => planBasic.classList.add("offer-highlight"), 0);
        window.setTimeout(() => planBasic.classList.remove("offer-highlight"), 1200);
      }
    });

    document.addEventListener(
      "keydown",
      (e) => {
        if (!upsellModal || upsellModal.hidden) return;
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      { capture: true },
    );
  }

  const proofCarousels = document.querySelectorAll(
    '.social-carousel[data-carousel="proofs"]',
  );
  proofCarousels.forEach((carousel) => {
    const track = carousel.querySelector(".social-carousel-track");
    if (!track) return;

    const originalSlides = Array.from(track.children).filter((el) =>
      el.classList.contains("social-proof-item"),
    );
    if (originalSlides.length === 0) return;

    let distancePx = 0;
    let offsetPx = 0;
    let lastTs = 0;
    let rafId = 0;
    let running = false;
    let paused = false;
    let holdTimer = 0;
    let inViewport = true;

    const clearClones = () => {
      Array.from(track.children).forEach((el) => {
        if (el instanceof HTMLElement && el.dataset.clone === "true") el.remove();
      });
    };

    const buildClones = () => {
      clearClones();
      originalSlides.forEach((slide) => {
        const clone = slide.cloneNode(true);
        if (clone instanceof HTMLElement) clone.dataset.clone = "true";
        track.appendChild(clone);
      });
    };

    const measure = () => {
      buildClones();
      const total = track.scrollWidth;
      distancePx = total > 0 ? total / 2 : 0;
      if (distancePx > 0) offsetPx = offsetPx % distancePx;
    };

    const step = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      if (!paused && inViewport && distancePx > 0) {
        const pxPerSecond = 35;
        offsetPx += pxPerSecond * dt;
        if (offsetPx >= distancePx) offsetPx -= distancePx;
        track.style.transform = `translate3d(${-offsetPx}px, 0, 0)`;
      }

      if (running) rafId = window.requestAnimationFrame(step);
    };

    const startLoop = () => {
      if (running || document.hidden || !inViewport) return;
      running = true;
      lastTs = 0;
      rafId = window.requestAnimationFrame(step);
    };

    const stopLoop = () => {
      if (!running) return;
      running = false;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const scheduleMeasure = (() => {
      let scheduled = false;
      return () => {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(() => {
          scheduled = false;
          measure();
        });
      };
    })();

    const onPointerDown = () => {
      if (holdTimer) window.clearTimeout(holdTimer);
      holdTimer = window.setTimeout(() => {
        paused = true;
      }, 250);
    };

    const onPointerUp = () => {
      if (holdTimer) window.clearTimeout(holdTimer);
      holdTimer = 0;
      paused = false;
    };

    carousel.addEventListener("pointerdown", onPointerDown, { passive: true });
    carousel.addEventListener("pointerup", onPointerUp, { passive: true });
    carousel.addEventListener("pointercancel", onPointerUp, { passive: true });
    carousel.addEventListener("pointerleave", onPointerUp, { passive: true });

    const images = originalSlides
      .map((el) => el.querySelector("img"))
      .filter((img) => img instanceof HTMLImageElement);
    images.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", scheduleMeasure, { once: true });
      img.addEventListener("error", scheduleMeasure, { once: true });
    });

    measure();
    scheduleMeasure();

    window.addEventListener("resize", scheduleMeasure, { passive: true });
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target !== carousel) return;
          inViewport = entry.isIntersecting;
          if (inViewport) startLoop();
          else stopLoop();
        });
      },
      { threshold: 0.05 },
    );
    visibilityObserver.observe(carousel);

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) stopLoop();
        else startLoop();
      },
      { passive: true },
    );

    startLoop();
  });
})();
