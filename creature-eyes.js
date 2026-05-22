/**
 * Creature pill — dot gaze + blink (ported from CreatureFace/useEyeGaze.ts + EyeCanvas.tsx).
 * Initializes any matching pill on the page (hero demo, CTA face, etc.).
 */
(function initCreatureEyes() {
  /** PILL_EYE_LEFT / PILL_EYE_RIGHT — widened for more pronounced separation */
  const EYE_LEFT_PCT = [25, 50];
  const EYE_RIGHT_PCT = [75, 50];
  const DOT_DIAMETER_FRAC_OF_H = 0.175;

  /** useEyeGaze.ts */
  const IDLE_TO_CENTER_MS = 750;

  /** EyeCanvas.tsx — blink */
  const BLINK_CLOSE_MS = 80;
  const BLINK_OPEN_MS = 120;
  const BLINK_PERIOD_MIN_MS = 3000;
  const BLINK_PERIOD_MAX_MS = 5000;

  function maxGazeOffsetDotPx(eyeR) {
    return Math.max(1.25, eyeR * 0.72);
  }

  function initCreatureGaze(pill, faceImg, canvas) {
    if (!pill || !canvas || !canvas.getContext("2d")) return;

    const ctx = canvas.getContext("2d");
    const mouse = { x: Number.NaN, y: Number.NaN };
    let lastMoveAtMs = 0;

    function onPointer(clientX, clientY) {
      mouse.x = clientX;
      mouse.y = clientY;
      lastMoveAtMs = performance.now();
    }

    window.addEventListener(
      "mousemove",
      (e) => {
        onPointer(e.clientX, e.clientY);
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];
        if (t) onPointer(t.clientX, t.clientY);
      },
      { passive: true }
    );

    const gazeSmooth = { ox: 0, oy: 0 };
    let blinkPhase = "open";
    let blinkNextAtMs = 0;
    let blinkPhaseStartMs = 0;

    function scheduleNextBlinkPeriod(now) {
      blinkNextAtMs =
        now + BLINK_PERIOD_MIN_MS + Math.random() * (BLINK_PERIOD_MAX_MS - BLINK_PERIOD_MIN_MS);
    }

    function drawEye(ex, ey, r, scaleY, ox, oy, fill) {
      if (r <= 0.05 || scaleY <= 0.02) return;
      ctx.save();
      ctx.translate(ex, ey);
      ctx.scale(1, scaleY);
      ctx.translate(ox, oy);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.restore();
    }

    function loop() {
      const now = performance.now();
      const rect = pill.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const dpr = window.devicePixelRatio || 1;

      if (w <= 0 || h <= 0) {
        requestAnimationFrame(loop);
        return;
      }

      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const emotion = faceImg?.getAttribute("data-emotion") || "hopeful";
      const skipBlink = emotion === "dying";

      let blinkSquish = 1;
      if (!skipBlink) {
        if (blinkPhase === "open" && now >= blinkNextAtMs) {
          blinkPhase = "closing";
          blinkPhaseStartMs = now;
        } else if (blinkPhase === "closing") {
          const t = (now - blinkPhaseStartMs) / BLINK_CLOSE_MS;
          blinkSquish = 1 - Math.min(1, t);
          if (t >= 1) {
            blinkPhase = "opening";
            blinkPhaseStartMs = now;
          }
        } else if (blinkPhase === "opening") {
          const t = (now - blinkPhaseStartMs) / BLINK_OPEN_MS;
          blinkSquish = Math.min(1, t);
          if (t >= 1) {
            blinkPhase = "open";
            scheduleNextBlinkPeriod(now);
          }
        }

        if (blinkNextAtMs === 0) {
          scheduleNextBlinkPeriod(now);
        }
      }

      const lx = (EYE_LEFT_PCT[0] / 100) * w;
      const ly = (EYE_LEFT_PCT[1] / 100) * h;
      const rx = (EYE_RIGHT_PCT[0] / 100) * w;
      const ry = (EYE_RIGHT_PCT[1] / 100) * h;

      const baseR = (h * DOT_DIAMETER_FRAC_OF_H) / 2;
      const eyeR = Math.max(0, baseR);

      const idleMs = now - lastMoveAtMs;
      const tracking = idleMs < IDLE_TO_CENTER_MS && !Number.isNaN(mouse.x);

      let tx = 0;
      let ty = 0;
      if (tracking) {
        const midX = (lx + rx) / 2;
        const midY = (ly + ry) / 2;
        const localX = mouse.x - rect.left;
        const localY = mouse.y - rect.top;
        const dx = localX - midX;
        const dy = localY - midY;
        const len = Math.hypot(dx, dy) || 1;
        const cap = maxGazeOffsetDotPx(eyeR);
        const mag = Math.min(cap, len);
        tx = (dx / len) * mag;
        ty = (dy / len) * mag;
      }

      const k = tracking ? 0.58 : 0.24;
      gazeSmooth.ox += (tx - gazeSmooth.ox) * k;
      gazeSmooth.oy += (ty - gazeSmooth.oy) * k;

      const fill = "#141414";
      drawEye(lx, ly, eyeR, blinkSquish, gazeSmooth.ox, gazeSmooth.oy, fill);
      drawEye(rx, ry, eyeR, blinkSquish, gazeSmooth.ox, gazeSmooth.oy, fill);

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  const shell = document.getElementById("scroll-demo-shell");
  if (shell) {
    initCreatureGaze(
      shell.querySelector(".hero-demo-creature-pill"),
      shell.querySelector(".hero-demo-creature-mouth"),
      shell.querySelector(".hero-demo-creature-eyes")
    );
  }

  const ctaPill = document.getElementById("cta-creature-pill");
  if (ctaPill) {
    initCreatureGaze(
      ctaPill,
      ctaPill.querySelector(".cta-creature-mouth"),
      ctaPill.querySelector(".cta-creature-eyes")
    );
  }
})();
