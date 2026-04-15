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

  const carousels = document.querySelectorAll("[data-carousel]");
  carousels.forEach((carousel) => {
    const viewport = carousel.querySelector(".social-carousel-viewport");
    const track = carousel.querySelector(".social-carousel-track");
    const prevBtn = carousel.querySelector(".carousel-prev");
    const nextBtn = carousel.querySelector(".carousel-next");
    const dots = carousel.querySelector(".carousel-dots");
    if (!viewport || !track || !dots) return;

    const slides = Array.from(track.children).filter((el) =>
      el.classList.contains("social-proof-item"),
    );
    if (slides.length === 0) return;

    const dotButtons = slides.map((_, idx) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", `Ir para depoimento ${idx + 1}`);
      dot.addEventListener("click", () => {
        slides[idx].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
      dots.appendChild(dot);
      return dot;
    });

    const getActiveIndex = () => {
      const viewportRect = viewport.getBoundingClientRect();
      const viewportCenter = viewportRect.left + viewportRect.width / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      slides.forEach((slide, idx) => {
        const rect = slide.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const dist = Math.abs(center - viewportCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      return bestIdx;
    };

    const setActive = (idx) => {
      dotButtons.forEach((dot, i) => dot.classList.toggle("is-active", i === idx));
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === slides.length - 1;
    };

    let rafId = 0;
    const onScroll = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        setActive(getActiveIndex());
        rafId = 0;
      });
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    const scrollToIndex = (idx) => {
      const bounded = Math.max(0, Math.min(slides.length - 1, idx));
      slides[bounded].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      setActive(bounded);
    };

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        scrollToIndex(getActiveIndex() - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        scrollToIndex(getActiveIndex() + 1);
      });
    }

    setActive(0);
  });
})();
