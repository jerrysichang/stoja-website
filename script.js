const modal = document.getElementById("download-modal");
const openButtons = document.querySelectorAll("[data-open-download]");
const closeButtons = document.querySelectorAll("[data-close-download]");
const yearEl = document.getElementById("year");
let modalUnlockTimeoutId = null;
let prevHtmlOverflow = "";
let prevBodyOverflow = "";
let prevBodyPaddingRight = "";

if (yearEl) {
  yearEl.textContent = new Date().getFullYear().toString();
}

function openModal() {
  if (!modal) return;
  if (modalUnlockTimeoutId) {
    window.clearTimeout(modalUnlockTimeoutId);
    modalUnlockTimeoutId = null;
  }
  const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  prevHtmlOverflow = document.documentElement.style.overflow;
  prevBodyOverflow = document.body.style.overflow;
  prevBodyPaddingRight = document.body.style.paddingRight;

  if (scrollbarWidth > 0) {
    const currentBodyPadding = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.paddingRight = `${currentBodyPadding + scrollbarWidth}px`;
  }
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modal || !modal.classList.contains("is-open")) return;
  modal.setAttribute("aria-hidden", "true");
  const unlockBodyScroll = () => {
    document.documentElement.style.overflow = prevHtmlOverflow;
    document.body.style.overflow = prevBodyOverflow;
    document.body.style.paddingRight = prevBodyPaddingRight;
    if (modalUnlockTimeoutId) {
      window.clearTimeout(modalUnlockTimeoutId);
      modalUnlockTimeoutId = null;
    }
  };

  modal.addEventListener(
    "transitionend",
    (event) => {
      if (event.target !== modal || event.propertyName !== "opacity") return;
      unlockBodyScroll();
    },
    { once: true }
  );
  // Fallback in case transitionend is skipped/interrupted.
  modalUnlockTimeoutId = window.setTimeout(unlockBodyScroll, 320);
  modal.classList.remove("is-open");
  // Deterministic unlock so scroll never remains stuck.
  unlockBodyScroll();
}

openButtons.forEach((button) => {
  button.addEventListener("click", openModal);
});

closeButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

/**
 * Draggable hero preview: drag from the clock area (center of the top bar).
 */
(function initHeroDemoDrag() {
  // Dragging disabled by request.
  return;

})();

/**
 * Constant parallax shift for the floating shell, mapped to total page scroll:
 * starts at zero and reaches full rest offset exactly at scroll end.
 */
(function initHeroDemoDocking() {
  const stage = document.querySelector(".hero-demo-stage");
  const cta = document.querySelector(".hero-download");
  if (!stage) return;

  const START_TOP_RATIO = 0.66;
  const END_TOP_RATIO = 0.42;
  const NARROW_BREAKPOINT_PX = 860;
  const END_TOP_RATIO_NARROW = 0.36;

  function updateDockState() {
    const viewportH = window.innerHeight;
    const maxScrollY = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollProgress = Math.min(1, Math.max(0, window.scrollY / maxScrollY));

    const endTopRatio =
      window.innerWidth <= NARROW_BREAKPOINT_PX ? END_TOP_RATIO_NARROW : END_TOP_RATIO;
    const endPushY = -viewportH * (START_TOP_RATIO - endTopRatio);

    const pushY = endPushY * scrollProgress;

    stage.style.setProperty("--hero-stage-push", `${pushY.toFixed(2)}px`);
  }

  window.addEventListener("scroll", updateDockState, { passive: true });
  window.addEventListener("resize", updateDockState);
  updateDockState();
})();

/**
 * Anchored cursor-lean motion:
 * stays pinned to its base location, leans toward cursor, then returns to base.
 */
(function initHeroDemoCursorFollow() {
  const pos = document.getElementById("hero-demo-pos");
  if (!pos) return;

  const anchor = { x: 0, y: 0 };

  function readOffsetsFromTransform() {
    const t = pos.style.transform || "";
    const m = t.match(/-50% \+ (-?\d+(?:\.\d+)?)px\), calc\(-50% \+ (-?\d+(?:\.\d+)?)px\)/);
    if (!m) return null;
    return { x: Number(m[1]), y: Number(m[2]) };
  }

  const initial = readOffsetsFromTransform();
  if (initial) {
    anchor.x = initial.x;
    anchor.y = initial.y;
  }

  function frame() {
    pos.style.transform = `translate(calc(-50% + ${anchor.x.toFixed(2)}px), calc(-50% + ${anchor.y.toFixed(2)}px))`;

    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
})();

/**
 * Homepage background mask follows the floating shell position.
 */
(function initCursorMaskTracking() {
  const stage = document.querySelector(".hero-demo-stage");

  function setMaskPosition(x, y) {
    document.documentElement.style.setProperty("--cursor-x", `${x}px`);
    document.documentElement.style.setProperty("--cursor-y", `${y}px`);
  }

  function frame() {
    if (stage) {
      const rect = stage.getBoundingClientRect();
      setMaskPosition(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5);
    } else {
      setMaskPosition(window.innerWidth * 0.5, window.innerHeight * 0.5);
    }
    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
})();

/**
 * Tagline word avoidance: words are pushed away from the floating shell.
 */
(function initTaglineWordAvoidance() {
  const pos = document.getElementById("hero-demo-pos");
  const words = Array.from(document.querySelectorAll(".tagline-word"));
  if (!pos || words.length === 0) return;

  const EFFECT_RADIUS_PX = 460;
  const MAX_PUSH_PX = 118;
  const WIDE_MAX_PUSH_MULT = 1.45;
  const WIDE_LATERAL_K = 0.95;
  const EASE = 0.18;
  const NARROW_BREAKPOINT_PX = 860;

  const state = new WeakMap();
  words.forEach((word) => state.set(word, { x: 0, y: 0 }));

  function getLateralScale(word) {
    const raw = word.dataset.lateral;
    if (raw == null || raw === "") return 1;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return 1;
    return n;
  }

  function frame() {
    const shellRect = pos.getBoundingClientRect();
    const shellCx = shellRect.left + shellRect.width * 0.5;
    const shellCy = shellRect.top + shellRect.height * 0.5;
    const shellRadius = Math.hypot(shellRect.width, shellRect.height) * 0.5;
    const influenceRadius = shellRadius + EFFECT_RADIUS_PX;

    for (const word of words) {
      const rect = word.getBoundingClientRect();
      const wx = rect.left + rect.width * 0.5;
      const wy = rect.top + rect.height * 0.5;

      let dx = wx - shellCx;
      let dy = wy - shellCy;
      let dist = Math.hypot(dx, dy);
      if (dist < 0.001) {
        dx = 1;
        dy = 0;
        dist = 1;
      }

      let tx = 0;
      let ty = 0;
      if (dist < influenceRadius) {
        const outsideFromEdge = Math.max(0, dist - shellRadius);
        const t = 1 - outsideFromEdge / EFFECT_RADIUS_PX;
        const isWide = word.dataset.wide === "true";
        const pushMax = MAX_PUSH_PX * (isWide ? WIDE_MAX_PUSH_MULT : 1);
        const push = pushMax * t * t;
        const radialX = (dx / dist) * push;
        const radialY = (dy / dist) * push;
        const isNarrow = window.innerWidth <= NARROW_BREAKPOINT_PX;

        if (isNarrow) {
          tx = 0;
          ty = radialY;
        } else {
          const flowDir = word.dataset.flow === "left" ? -1 : 1;
          const lateralScale = getLateralScale(word);
          const lateralKBase = isWide ? WIDE_LATERAL_K : 0.72;
          const lateralBias = flowDir * push * lateralKBase * lateralScale;
          tx = radialX + lateralBias;
          ty = radialY * 0.55;
        }
      }

      const s = state.get(word);
      s.x += (tx - s.x) * EASE;
      s.y += (ty - s.y) * EASE;
      word.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0)`;
    }

    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
})();
