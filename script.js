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
 * Cursor-follow locomotion with deadzone + viewport collision.
 */
(function initHeroDemoCursorFollow() {
  const pos = document.getElementById("hero-demo-pos");
  const footer = document.querySelector(".site-footer");
  const header = document.querySelector(".site-header");
  if (!pos) return;

  const FOLLOW_EASE = 0.0044;
  const VELOCITY_DAMPING = 0.96;
  const MAX_SPEED = 5.6;
  const BOUNCE_DAMPING = 0.45;
  const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, active: false };
  const smooth = { x: 0, y: 0 };
  const velocity = { x: 0, y: 0 };

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
    velocity.x = 0;
    velocity.y = 0;
  });
  window.addEventListener("blur", () => {
    pointer.active = false;
    velocity.x = 0;
    velocity.y = 0;
  });

  const initial = readOffsetsFromTransform();
  if (initial) {
    smooth.x = initial.x;
    smooth.y = initial.y;
  }

  function frame() {
    const rect = pos.getBoundingClientRect();
    if (
      pointer.active &&
      (pointer.x < 0 || pointer.x > window.innerWidth || pointer.y < 0 || pointer.y > window.innerHeight)
    ) {
      pointer.active = false;
      velocity.x = 0;
      velocity.y = 0;
    }

    const deadLeft = rect.left;
    const deadRight = rect.right;
    const deadTop = rect.top;
    const deadBottom = rect.bottom;
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

    let ax = 0;
    let ay = 0;
    if (pointer.active && !pointerOverFooter && !pointerOverHeader) {
      const outsideDx = Math.max(deadLeft - pointer.x, 0, pointer.x - deadRight);
      const outsideDy = Math.max(deadTop - pointer.y, 0, pointer.y - deadBottom);
      const outsideDist = Math.hypot(outsideDx, outsideDy);
      if (outsideDist > 0) {
        const cx = rect.left + rect.width * 0.5;
        const cy = rect.top + rect.height * 0.5;
        const dx = pointer.x - cx;
        const dy = pointer.y - cy;
        const len = Math.hypot(dx, dy) || 1;
        const pull = outsideDist * FOLLOW_EASE;
        ax = (dx / len) * pull;
        ay = (dy / len) * pull;
      }
    }

    velocity.x = (velocity.x + ax) * VELOCITY_DAMPING;
    velocity.y = (velocity.y + ay) * VELOCITY_DAMPING;
    const speed = Math.hypot(velocity.x, velocity.y);
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      velocity.x *= scale;
      velocity.y *= scale;
    }
    smooth.x += velocity.x;
    smooth.y += velocity.y;

    pos.style.transform = `translate(calc(-50% + ${smooth.x.toFixed(2)}px), calc(-50% + ${smooth.y.toFixed(2)}px))`;

    // Collision: keep the component inside the viewport and bounce back.
    const posRect = pos.getBoundingClientRect();
    let collided = false;
    let topLimit = 0;
    if (header) {
      const headerRect = header.getBoundingClientRect();
      if (headerRect.bottom > 0 && headerRect.height > 0) {
        topLimit = Math.max(topLimit, headerRect.bottom);
      }
    }

    if (posRect.left < 0) {
      smooth.x += -posRect.left;
      velocity.x = Math.abs(velocity.x) * BOUNCE_DAMPING;
      collided = true;
    } else if (posRect.right > window.innerWidth) {
      smooth.x -= posRect.right - window.innerWidth;
      velocity.x = -Math.abs(velocity.x) * BOUNCE_DAMPING;
      collided = true;
    }

    if (posRect.top < topLimit) {
      smooth.y += topLimit - posRect.top;
      velocity.y = Math.abs(velocity.y) * BOUNCE_DAMPING;
      collided = true;
    } else {
      let bottomLimit = window.innerHeight;
      if (footer) {
        const footerTop = footer.getBoundingClientRect().top;
        if (Number.isFinite(footerTop)) {
          bottomLimit = Math.min(bottomLimit, Math.max(0, footerTop));
        }
      }
      if (posRect.bottom > bottomLimit) {
        smooth.y -= posRect.bottom - bottomLimit;
        velocity.y = -Math.abs(velocity.y) * BOUNCE_DAMPING;
        collided = true;
      }
    }

    if (collided) {
      pos.style.transform = `translate(calc(-50% + ${smooth.x.toFixed(2)}px), calc(-50% + ${smooth.y.toFixed(2)}px))`;
    }

    const revealRect = pos.getBoundingClientRect();
    const revealX = revealRect.left + revealRect.width * 0.5;
    const revealY = revealRect.top + revealRect.height * 0.5;
    document.documentElement.style.setProperty("--cursor-x", `${revealX}px`);
    document.documentElement.style.setProperty("--cursor-y", `${revealY}px`);

    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
})();
