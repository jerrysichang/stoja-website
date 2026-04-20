const modal = document.getElementById("download-modal");
const openButtons = document.querySelectorAll("[data-open-download]");
const closeButtons = document.querySelectorAll("[data-close-download]");
const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = new Date().getFullYear().toString();
}

function openModal() {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modal || !modal.classList.contains("is-open")) return;
  modal.setAttribute("aria-hidden", "true");
  modal.addEventListener(
    "transitionend",
    (event) => {
      if (event.target !== modal || event.propertyName !== "opacity") return;
      document.body.style.overflow = "";
    },
    { once: true }
  );
  modal.classList.remove("is-open");
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
  const pos = document.getElementById("hero-demo-pos");
  const triggers = document.querySelectorAll("[data-hero-drag]");
  if (!pos || triggers.length === 0) return;

  let ox = 0;
  let oy = 0;
  let dragging = false;
  let pointerId = null;
  let startClientX = 0;
  let startClientY = 0;
  let startOx = 0;
  let startOy = 0;

  function applyTransform() {
    pos.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    dragging = true;
    pointerId = e.pointerId;
    startClientX = e.clientX;
    startClientY = e.clientY;
    startOx = ox;
    startOy = oy;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
    pos.classList.add("hero-demo--dragging");
  }

  function onPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    ox = startOx + (e.clientX - startClientX);
    oy = startOy + (e.clientY - startClientY);
    applyTransform();
  }

  function onPointerEnd(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (_) {
      /* ignore */
    }
    pos.classList.remove("hero-demo--dragging");
  }

  triggers.forEach((trigger) => {
    trigger.style.cursor = "grab";
    trigger.addEventListener("pointerdown", onPointerDown);
    trigger.addEventListener("pointermove", onPointerMove);
    trigger.addEventListener("pointerup", onPointerEnd);
    trigger.addEventListener("pointercancel", onPointerEnd);
  });

  applyTransform();
})();
