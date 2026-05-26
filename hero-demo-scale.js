/**
 * Fluid hero demo scale — frame gets the final layout size; the 240px app scales
 * inside with transform so document scrollWidth matches the visible demo (zoom and
 * transform-only on the outer frame both inflate scrollWidth in Chromium/Arc).
 */
(function initHeroDemoScale() {
  const BASE_WIDTH = 240;
  const LAYOUT_HEIGHT = 420;
  const SHELL_RADIUS = 12;
  const CTA_FACE_RADIUS = 28;
  const root = document.documentElement;

  function readVarPx(name) {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;visibility:hidden;pointer-events:none;top:0;left:0;height:0;width:var(" +
      name +
      ");";
    root.appendChild(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  }

  function computeDemoWidth(contentWidth) {
    const sideInset = readVarPx("--hero-demo-side-inset");
    const maxWidth = readVarPx("--hero-demo-max-width") || 756;
    const viewportCap = Math.max(0, root.clientWidth - 2 * readVarPx("--page-gutter"));
    return Math.min(
      Math.max(0, contentWidth - 2 * sideInset),
      maxWidth,
      contentWidth,
      viewportCap
    );
  }

  function measureContentHeight(app) {
    const stage = app.querySelector(".hero-demo-stage");
    const shell = app.querySelector(".hero-demo-shell");
    const source = stage || shell || app;
    return Math.max(source.offsetHeight, source.scrollHeight) || LAYOUT_HEIGHT;
  }

  function fitHeroTitle(brand) {
    const title = brand?.querySelector(".display");
    if (!title) return;

    const maxWidth = brand.clientWidth;
    if (maxWidth <= 0) return;

    let lo = 16;
    let hi = Math.round(maxWidth * 0.65);
    let best = lo;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      title.style.fontSize = `${mid}px`;
      if (title.scrollWidth <= maxWidth) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    title.style.fontSize = `${best}px`;
  }

  function applyHeroDemoShadow(frame, scale) {
    const y1 = Math.round(28 * scale);
    const blur1 = Math.round(72 * scale);
    const y2 = Math.round(12 * scale);
    const blur2 = Math.round(32 * scale);
    frame.style.boxShadow = `0 ${y1}px ${blur1}px rgba(0, 0, 0, 0.5), 0 ${y2}px ${blur2}px rgba(0, 0, 0, 0.28)`;
  }

  function applySharedDemoWidth(targetWidth, scale) {
    const ctaFace = document.querySelector(".cta-face");
    if (ctaFace) {
      ctaFace.style.width = `${Math.round(targetWidth)}px`;
      ctaFace.style.borderRadius = `${Math.round(CTA_FACE_RADIUS * scale)}px`;
    }
  }

  function update() {
    const stack = document.querySelector(".landing-hero-stack");
    const ctaInner = document.querySelector(".home-cta-inner");
    const contentWidth = stack?.clientWidth || ctaInner?.clientWidth || 0;
    if (contentWidth <= 0) return;

    const targetWidth = computeDemoWidth(contentWidth);
    const scale = targetWidth / BASE_WIDTH;

    const frame = document.querySelector(".landing-hero-app-frame");
    const app = document.querySelector(".landing-hero-app");
    const brand = document.querySelector(".landing-hero-brand");

    if (frame && app) {
      const contentHeight = measureContentHeight(app);

      frame.style.width = `${Math.round(targetWidth)}px`;
      frame.style.height = `${Math.round(contentHeight * scale)}px`;
      frame.style.borderRadius = `${Math.round(SHELL_RADIUS * scale)}px`;
      frame.style.zoom = "";
      applyHeroDemoShadow(frame, scale);

      app.style.width = `${BASE_WIDTH}px`;
      app.style.height = `${contentHeight}px`;
      app.style.zoom = "";
      app.style.transform = Math.abs(scale - 1) < 0.001 ? "" : `scale(${scale})`;
    }

    applySharedDemoWidth(targetWidth, scale);

    if (brand) fitHeroTitle(brand);
  }

  update();

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(update);
    const stack = document.querySelector(".landing-hero-stack");
    const ctaInner = document.querySelector(".home-cta-inner");
    if (stack) observer.observe(stack);
    if (ctaInner) observer.observe(ctaInner);
  }

  window.addEventListener("resize", update, { passive: true });
  if (document.fonts?.ready) {
    document.fonts.ready.then(update);
  }
})();
