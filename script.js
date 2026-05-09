const topbar = document.querySelector(".topbar");
const SCROLL_TOPBAR = 32;

function syncTopbarBackground() {
  if (!topbar) return;
  const y = window.scrollY || document.documentElement.scrollTop;
  topbar.classList.toggle("is-scrolled", y > SCROLL_TOPBAR);
}

window.addEventListener("scroll", syncTopbarBackground, { passive: true });
window.addEventListener("resize", syncTopbarBackground);
syncTopbarBackground();

/* Menú hamburguesa (viewport ≤1366 según breakpoint en CSS) */
(function initMobileNavDrawer() {
  const drawer = document.getElementById("site-nav-drawer");
  const toggle = document.querySelector(".nav-menu-toggle");
  if (!drawer || !toggle) return;

  const mq = window.matchMedia("(max-width: 1366px)");
  /** @returns {HTMLElement | null} */
  const qs = (sel) =>
    drawer && typeof drawer.querySelector === "function"
      ? drawer.querySelector(sel)
      : null;
  let previousFocus = null;

  function openDrawer() {
    previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    drawer.classList.add("nav-drawer--open");
    drawer.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-drawer-open");
    document.documentElement.classList.add("nav-drawer-open");

    window.setTimeout(() => {
      const focusEl = qs(".nav-drawer__close") || qs(".nav-drawer__list a");
      if (focusEl && typeof focusEl.focus === "function") focusEl.focus();
    }, 60);
  }

  function closeDrawer() {
    drawer.classList.remove("nav-drawer--open");
    drawer.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-drawer-open");
    document.documentElement.classList.remove("nav-drawer-open");

    if (previousFocus && typeof previousFocus.focus === "function") {
      window.setTimeout(() => previousFocus.focus(), 0);
    }
    previousFocus = null;
  }

  function onToggleClick() {
    drawer.classList.contains("nav-drawer--open") ? closeDrawer() : openDrawer();
  }

  toggle.addEventListener("click", onToggleClick);

  const closeBtn = qs(".nav-drawer__close");
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);

  const backdrop = qs(".nav-drawer__backdrop");
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  drawer.querySelectorAll(".nav-drawer__list a, .nav-drawer__cta").forEach((el) => {
    el.addEventListener("click", closeDrawer);
  });

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && drawer.classList.contains("nav-drawer--open")) {
        closeDrawer();
      }
    },
    true
  );

  const onMqChange = () => {
    if (!mq.matches) closeDrawer();
  };
  if (typeof mq.addEventListener === "function") mq.addEventListener("change", onMqChange);
  else if (typeof mq.addListener === "function") mq.addListener(onMqChange);
})();

const siteYearEl = document.getElementById("site-year");
if (siteYearEl) siteYearEl.textContent = String(new Date().getFullYear());

const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const cbcTestimonials = document.querySelector(".cbc-testimonials");
if (cbcTestimonials) {
  const cbcObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
  );
  cbcObserver.observe(cbcTestimonials);
}
