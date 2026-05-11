(function markGoogleChrome() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const isEdge = /\bEdg(e|A|iOS)?\//i.test(ua);
  const isChrome =
    !isEdge && (/\bChrom(e|ium)\//.test(ua) || /\bCriOS\//.test(ua));
  if (isChrome) document.documentElement.classList.add("ua-chrome");
})();

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

/* Agenda (3 modalidades): elegir día/hora en Calendly → Hotmart; tras pagar, redirigir a Calendly (configurar en Hotmart) para confirmar reserva */
(function initAgendaCalendlyThenHotmart() {
  const modal = document.getElementById("seb-calendly-hotmart-modal");
  const host = document.getElementById("seb-calendly-inline-host");
  if (!modal || !host) return;

  const openBtns = document.querySelectorAll("[data-seb-calendly-flow-open]");
  const closeEls = modal.querySelectorAll("[data-seb-flow-modal-close]");
  const dialog = modal.querySelector(".seb-flow-modal__dialog");

  /** @type {string} */
  let activeCalendlyUrl = "https://calendly.com/sharonnicolett/30min";
  /** @type {string} */
  let activeHotmartUrl = "https://pay.hotmart.com/R105774148D";

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  /** Evita doble redirección si Calendly repite el evento */
  let redirectedToHotmart = false;

  let calendlyScriptPromise = null;
  /** @type {ResizeObserver | null} */
  let calendlyResizeObserver = null;
  /** @type {HTMLElement | null} */
  let lastFocus = null;

  function syncCalendlyIframeHeight() {
    const wrap = host.querySelector(".calendly-inline-widget");
    const iframe = host.querySelector("iframe");
    const h = Math.max(host.clientHeight, 480);
    if (wrap) {
      wrap.style.height = `${h}px`;
      wrap.style.minHeight = `${h}px`;
    }
    if (iframe) {
      iframe.style.height = `${h}px`;
      iframe.style.minHeight = `${h}px`;
    }
  }

  function loadCalendlyScript() {
    if (window.Calendly) return Promise.resolve();
    if (calendlyScriptPromise) return calendlyScriptPromise;
    calendlyScriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://assets.calendly.com/assets/external/widget.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Calendly script failed"));
      document.head.appendChild(s);
    });
    return calendlyScriptPromise;
  }

  function mountCalendly() {
    host.innerHTML = "";
    if (typeof window.Calendly === "undefined" || typeof window.Calendly.initInlineWidget !== "function") {
      return;
    }
    window.Calendly.initInlineWidget({
      url: activeCalendlyUrl,
      parentElement: host,
    });
    requestAnimationFrame(() => {
      syncCalendlyIframeHeight();
      requestAnimationFrame(syncCalendlyIframeHeight);
    });
    window.setTimeout(syncCalendlyIframeHeight, 350);
    window.setTimeout(syncCalendlyIframeHeight, 900);
  }

  function resetFlow() {
    redirectedToHotmart = false;
    host.innerHTML = "";
    const title = document.getElementById("seb-flow-modal-title");
    if (title) title.textContent = "Paso 1: elige día y hora";
  }

  /**
   * @param {HTMLElement} [trigger] Botón con data-calendly-url, data-hotmart-url
   */
  function openModal(trigger) {
    if (trigger && trigger.dataset) {
      if (trigger.dataset.calendlyUrl) activeCalendlyUrl = trigger.dataset.calendlyUrl.trim();
      if (trigger.dataset.hotmartUrl) activeHotmartUrl = trigger.dataset.hotmartUrl.trim();
    }
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    resetFlow();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("seb-flow-modal-open");
    document.documentElement.classList.add("seb-flow-modal-open");

    loadCalendlyScript()
      .then(() => {
        mountCalendly();
        if (typeof ResizeObserver !== "undefined") {
          if (calendlyResizeObserver) calendlyResizeObserver.disconnect();
          calendlyResizeObserver = new ResizeObserver(() => syncCalendlyIframeHeight());
          calendlyResizeObserver.observe(host);
        }
        window.removeEventListener("resize", syncCalendlyIframeHeight);
        window.addEventListener("resize", syncCalendlyIframeHeight);
        if (dialog && typeof dialog.focus === "function") dialog.focus();
      })
      .catch(() => {
        host.innerHTML =
          '<p class="seb-flow-modal__error">No se pudo cargar el calendario. <a href="' +
          escapeHtml(activeCalendlyUrl) +
          '" target="_blank" rel="noopener noreferrer">Abrir Calendly en una pestaña nueva</a>.</p>';
      });
  }

  function closeModal() {
    window.removeEventListener("resize", syncCalendlyIframeHeight);
    if (calendlyResizeObserver) {
      calendlyResizeObserver.disconnect();
      calendlyResizeObserver = null;
    }
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("seb-flow-modal-open");
    document.documentElement.classList.remove("seb-flow-modal-open");
    resetFlow();
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    lastFocus = null;
  }

  openBtns.forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn));
  });

  closeEls.forEach((el) => {
    el.addEventListener("click", () => closeModal());
  });

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    },
    true
  );

  function isCalendlyEvent(/** @type {MessageEvent} */ e) {
    return (
      e.origin === "https://calendly.com" &&
      e.data &&
      typeof e.data === "object" &&
      typeof e.data.event === "string" &&
      e.data.event.indexOf("calendly.") === 0
    );
  }

  window.addEventListener("message", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (!isCalendlyEvent(e)) return;
    if (e.data.event === "calendly.date_and_time_selected" && !redirectedToHotmart) {
      redirectedToHotmart = true;
      window.location.assign(activeHotmartUrl);
    }
  });
})();
