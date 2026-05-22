const modal = document.getElementById("download-modal");
const openButtons = document.querySelectorAll("[data-open-download]");
const closeButtons = document.querySelectorAll("[data-close-download]");
const yearEl = document.getElementById("year");
const APP_STORE_URL = "https://apps.apple.com/us/app/stoja/id6761839249?mt=12";
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
  modalUnlockTimeoutId = window.setTimeout(unlockBodyScroll, 320);
  modal.classList.remove("is-open");
  unlockBodyScroll();
}

openButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    if (button.closest(".hero-demo-shell")) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    window.open(APP_STORE_URL, "_blank", "noopener,noreferrer");
  });
});

(function initDownloadLinksNewTab() {
  const selector =
    'a.header-download, a.cta-download, a[href*="apps.apple.com/us/app/stoja"]';

  function bindDownloadLink(link) {
    if (link.dataset.downloadNewTab === "true") return;
    link.dataset.downloadNewTab = "true";
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.open(link.href || APP_STORE_URL, "_blank", "noopener,noreferrer");
    });
  }

  document.querySelectorAll(selector).forEach(bindDownloadLink);

  const footer = document.querySelector("[data-site-footer]");
  if (footer && typeof MutationObserver !== "undefined") {
    new MutationObserver(() => {
      document.querySelectorAll(selector).forEach(bindDownloadLink);
    }).observe(footer, { childList: true, subtree: true });
  }
})();

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

(function initCtaDownloadFaceHover() {
  const mouth = document.querySelector(".cta-creature-mouth");
  if (!mouth) return;

  const buttons = document.querySelectorAll(".header-download, .cta-download");
  if (!buttons.length) return;

  const HOVER_DELAY_MS = 500;
  const LEAVE_DEBOUNCE_MS = 50;

  const faces = {
    default: {
      src: "./assets/creature-face/hopeful.svg",
      emotion: "hopeful",
    },
    hover: {
      src: "./assets/creature-face/surprise.svg",
      emotion: "surprise",
    },
  };

  let delayTimer = null;
  let leaveTimer = null;

  function setFace(state) {
    const face = faces[state];
    mouth.src = face.src;
    mouth.setAttribute("data-emotion", face.emotion);
  }

  function anyActive() {
    return [...buttons].some((btn) => btn.matches(":hover") || btn === document.activeElement);
  }

  function clearDelayTimer() {
    if (delayTimer) {
      window.clearTimeout(delayTimer);
      delayTimer = null;
    }
  }

  function scheduleSurprise() {
    clearDelayTimer();
    delayTimer = window.setTimeout(() => {
      delayTimer = null;
      if (anyActive()) setFace("hover");
    }, HOVER_DELAY_MS);
  }

  function syncFace() {
    if (leaveTimer) {
      window.clearTimeout(leaveTimer);
      leaveTimer = null;
    }

    if (anyActive()) {
      scheduleSurprise();
      return;
    }

    clearDelayTimer();
    leaveTimer = window.setTimeout(() => {
      leaveTimer = null;
      if (!anyActive()) setFace("default");
    }, LEAVE_DEBOUNCE_MS);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("mouseenter", syncFace);
    btn.addEventListener("mouseleave", syncFace);
    btn.addEventListener("focus", syncFace);
    btn.addEventListener("blur", syncFace);
  });
})();

/**
 * Homepage background mask follows the sticky demo position.
 */
(function initCursorMaskTracking() {
  if (document.body.classList.contains("home-page")) return;

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
