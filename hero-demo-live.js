/**
 * Hero shell: live countdown + creature appraisal (mirrors Stoja-demo useCreatureState.computeAppraisal
 * + low-time emotion rotation). See DEFAULT_CREATURE_BEHAVIOR_CONFIG in useCreatureState.ts.
 */
(function initHeroDemoLive() {
  const shell = document.querySelector(".hero-demo-shell");
  if (!shell) return;

  const INITIAL_SEC = 13 * 60 + 48;

  const CONFIG = {
    hopefulMinTimeSeconds: 420,
    attentiveMinTimeSeconds: 240,
    urgentMinTimeSeconds: 90,
    hopefulEngagementMin: 0.5,
    attentiveEngagementMin: 0.4,
    idleNormalizationSeconds: 30
  };

  const WARNING_THRESHOLD_SECONDS = 7 * 60;
  const CRITICAL_THRESHOLD_SECONDS = 4 * 60;
  const ANGRY_HIDE_UNDER_SECONDS = 60;
  const DYING_RANDOM_SHOW_UNDER_SECONDS = 90;
  const LOW_TIME_TOGGLE_MIN_MS = 2800;
  const LOW_TIME_TOGGLE_MAX_MS = 4600;

  let remaining = INITIAL_SEC;
  let lowTimeEmotion = "desperate";
  let tickId = null;
  let lowRotateTimeoutId = null;

  const clockEl = shell.querySelector(".hero-demo-clock");
  const faceImg = shell.querySelector(".hero-demo-creature-mouth");

  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  function computeAppraisal(timeLeft, idleSeconds, lowEmotion) {
    const idleFrac = clamp(idleSeconds / Math.max(CONFIG.idleNormalizationSeconds, 1e-9), 0, 1);
    const engagement = 1 - idleFrac;
    if (timeLeft <= 0) return "content";
    if (timeLeft > CONFIG.hopefulMinTimeSeconds) {
      return engagement > CONFIG.hopefulEngagementMin ? "hopeful" : "content";
    }
    if (timeLeft > CONFIG.attentiveMinTimeSeconds) {
      return engagement > CONFIG.attentiveEngagementMin ? "attentive" : "anxious";
    }
    if (timeLeft > CONFIG.urgentMinTimeSeconds) return "urgent";
    return lowEmotion;
  }

  function pickNextLowTimeEmotion(tl, current) {
    const allowAngry = tl > ANGRY_HIDE_UNDER_SECONDS;
    const allowDying = tl <= DYING_RANDOM_SHOW_UNDER_SECONDS;
    const pool = ["desperate", "angry", "dying"].filter(
      (e) => (e !== "angry" || allowAngry) && (e !== "dying" || allowDying)
    );
    if (pool.length === 0) return "desperate";
    let next = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && next === current) {
      const alt = pool.filter((e) => e !== current);
      next = alt[Math.floor(Math.random() * alt.length)] ?? next;
    }
    return next;
  }

  function scheduleLowRotateDelayMs() {
    const minMs = LOW_TIME_TOGGLE_MIN_MS;
    const maxMs = Math.max(LOW_TIME_TOGGLE_MAX_MS, minMs + 1);
    const midMs = minMs + (maxMs - minMs) * 0.5;
    const roll = Math.random();
    const delay =
      roll < 0.45
        ? minMs + Math.random() * (midMs - minMs)
        : midMs + Math.random() * (maxMs - midMs);
    return Math.round(delay);
  }

  function formatMmSs(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    const mStr = m < 100 ? String(m).padStart(2, "0") : String(m);
    return `${mStr}:${String(r).padStart(2, "0")}`;
  }

  function applyTimerDigitStyle() {
    if (!clockEl) return;
    let color = "rgba(255, 255, 255, 0.92)";
    if (remaining <= CRITICAL_THRESHOLD_SECONDS) color = "rgba(255, 120, 120, 0.95)";
    else if (remaining <= WARNING_THRESHOLD_SECONDS) color = "rgba(255, 200, 140, 0.95)";
    clockEl.style.color = color;
  }

  function updateFace() {
    if (!faceImg) return;
    const emotion = computeAppraisal(remaining, 0, lowTimeEmotion);
    const url = `./assets/creature-face/${emotion}.svg`;
    if (faceImg.getAttribute("data-emotion") !== emotion) {
      faceImg.setAttribute("data-emotion", emotion);
      faceImg.src = url;
    }
  }

  function stopLowRotate() {
    if (lowRotateTimeoutId != null) {
      window.clearTimeout(lowRotateTimeoutId);
      lowRotateTimeoutId = null;
    }
  }

  function lowRotateLoop() {
    if (remaining <= 0 || remaining > CONFIG.urgentMinTimeSeconds) {
      stopLowRotate();
      return;
    }
    lowTimeEmotion = pickNextLowTimeEmotion(remaining, lowTimeEmotion);
    updateFace();
    lowRotateTimeoutId = window.setTimeout(lowRotateLoop, scheduleLowRotateDelayMs());
  }

  function maybeStartLowRotate() {
    if (remaining <= 0 || remaining > CONFIG.urgentMinTimeSeconds) return;
    if (lowRotateTimeoutId != null) return;
    lowRotateTimeoutId = window.setTimeout(lowRotateLoop, scheduleLowRotateDelayMs());
  }

  function tick() {
    if (remaining <= 0) {
      stopLowRotate();
      remaining = INITIAL_SEC;
      lowTimeEmotion = "desperate";
    } else {
      remaining -= 1;
      if (remaining === 0) stopLowRotate();
    }

    if (clockEl) clockEl.textContent = formatMmSs(remaining);
    applyTimerDigitStyle();
    updateFace();

    if (remaining > CONFIG.urgentMinTimeSeconds) {
      lowTimeEmotion = "desperate";
    }
    maybeStartLowRotate();
  }

  if (clockEl) clockEl.textContent = formatMmSs(remaining);
  applyTimerDigitStyle();
  faceImg?.setAttribute("data-emotion", "");
  updateFace();
  maybeStartLowRotate();
  tickId = window.setInterval(tick, 1000);
})();
