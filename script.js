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
})();
