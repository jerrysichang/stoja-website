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
 * Anchored cursor-lean motion:
 * stays pinned to its base location, leans toward cursor, then returns to base.
 */
(function initHeroDemoCursorFollow() {
  const pos = document.getElementById("hero-demo-pos");
  const footer = document.querySelector(".site-footer");
  const header = document.querySelector(".site-header");
  if (!pos) return;

  const LEAN_EASE = 0.09;
  const MAX_LEAN_PX = 40;
  const INFLUENCE_RADIUS_PX = 700;
  const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, active: false };
  const anchor = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };

  function setPointer(clientX, clientY) {
    pointer.x = clientX;
    pointer.y = clientY;
    pointer.active = true;
  }

  function readOffsetsFromTransform() {
    const t = pos.style.transform || "";
    const m = t.match(/-50% \+ (-?\d+(?:\.\d+)?)px\), calc\(-50% \+ (-?\d+(?:\.\d+)?)px\)/);
    if (!m) return null;
    return { x: Number(m[1]), y: Number(m[2]) };
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      setPointer(event.clientX, event.clientY);
    },
    { passive: true }
  );
  window.addEventListener(
    "mousemove",
    (event) => {
      setPointer(event.clientX, event.clientY);
    },
    { passive: true }
  );
  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      setPointer(touch.clientX, touch.clientY);
    },
    { passive: true }
  );
  window.addEventListener("mouseleave", () => {
    pointer.active = false;
  });
  window.addEventListener("blur", () => {
    pointer.active = false;
  });

  const initial = readOffsetsFromTransform();
  if (initial) {
    anchor.x = initial.x;
    anchor.y = initial.y;
  }
  smooth.x = anchor.x;
  smooth.y = anchor.y;

  function frame() {
    const rect = pos.getBoundingClientRect();
    if (
      pointer.active &&
      (pointer.x < 0 || pointer.x > window.innerWidth || pointer.y < 0 || pointer.y > window.innerHeight)
    ) {
      pointer.active = false;
    }

    const pointerOverFooter =
      pointer.active &&
      footer &&
      (() => {
        const footerRect = footer.getBoundingClientRect();
        return (
          pointer.x >= footerRect.left &&
          pointer.x <= footerRect.right &&
          pointer.y >= footerRect.top &&
          pointer.y <= footerRect.bottom
        );
      })();
    const pointerOverHeader =
      pointer.active &&
      header &&
      (() => {
        const headerRect = header.getBoundingClientRect();
        return (
          pointer.x >= headerRect.left &&
          pointer.x <= headerRect.right &&
          pointer.y >= headerRect.top &&
          pointer.y <= headerRect.bottom
        );
      })();

    let targetX = anchor.x;
    let targetY = anchor.y;
    if (pointer.active && !pointerOverFooter && !pointerOverHeader) {
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const dx = pointer.x - cx;
      const dy = pointer.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > 0 && dist < INFLUENCE_RADIUS_PX) {
        // Stronger lean when cursor is nearer, fading to 0 at influence radius.
        const influence = 1 - dist / INFLUENCE_RADIUS_PX;
        const lean = MAX_LEAN_PX * influence;
        targetX = anchor.x + (dx / dist) * lean;
        targetY = anchor.y + (dy / dist) * lean;
      }
    }

    smooth.x += (targetX - smooth.x) * LEAN_EASE;
    smooth.y += (targetY - smooth.y) * LEAN_EASE;

    pos.style.transform = `translate(calc(-50% + ${smooth.x.toFixed(2)}px), calc(-50% + ${smooth.y.toFixed(2)}px))`;

    const revealRect = pos.getBoundingClientRect();
    const revealX = revealRect.left + revealRect.width * 0.5;
    const revealY = revealRect.top + revealRect.height * 0.5;
    document.documentElement.style.setProperty("--cursor-x", `${revealX}px`);
    document.documentElement.style.setProperty("--cursor-y", `${revealY}px`);

    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
})();
