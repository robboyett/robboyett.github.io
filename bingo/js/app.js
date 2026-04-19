(function () {
  "use strict";

  const STORAGE_KEY = "ai-bingo-v2-remaining";
  const MUTE_KEY = "ai-bingo-v2-muted";
  const SPIN_MS = 2200;       // total spin time before the reveal
  const SHUFFLE_TICK_MS = 80; // how fast the reel cycles through random terms while spinning

  const allTerms = (window.AI_BINGO_TERMS || []).slice();
  const sounds = window.AI_BINGO_SOUNDS || {
    tick: () => {},
    reveal: () => {},
    openCard: () => {},
    close: () => {},
    done: () => {},
    reset: () => {},
    setMuted: () => {},
    isMuted: () => false,
    warmup: () => {},
  };

  // DOM
  const reelEl = document.getElementById("reel");
  const ballEl = reelEl.querySelector(".reel__ball");
  const textEl = reelEl.querySelector(".reel__text");
  const spinBtn = document.getElementById("spin-btn");
  const resetBtn = document.getElementById("reset-btn");
  const counterEl = document.getElementById("counter-remaining");
  const hintEl = document.getElementById("hint");

  const modal = document.getElementById("modal");
  const modalCard = modal.querySelector(".modal__card");
  const modalTerm = document.getElementById("modal-term");
  const modalShort = document.getElementById("modal-short");
  const modalDesc = document.getElementById("modal-desc");
  const modalBall = modal.querySelector(".modal__ball");
  const modalClose = document.getElementById("modal-close");

  const doneModal = document.getElementById("done-modal");
  const doneReset = document.getElementById("done-reset");

  const muteBtn = document.getElementById("mute-btn");

  // ---------- State ----------
  // remaining = array of indices (into allTerms) that haven't been called yet.
  let remaining = loadRemaining();
  let isSpinning = false;
  let lastTerm = null;

  function loadRemaining() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultRemaining();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return defaultRemaining();
      // sanity-check indices
      const valid = parsed.filter(
        (i) => Number.isInteger(i) && i >= 0 && i < allTerms.length
      );
      if (valid.length === 0) return defaultRemaining();
      return valid;
    } catch (_) {
      return defaultRemaining();
    }
  }

  function defaultRemaining() {
    return allTerms.map((_, i) => i);
  }

  function saveRemaining() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } catch (_) {
      /* ignore */
    }
  }

  function updateCounter() {
    counterEl.textContent = String(remaining.length);
  }

  // ---------- Helpers ----------
  function colorFor(term) {
    // Pick a "BINGO" colour band by first letter so the ball changes colour like a real bingo ball.
    const letter = (term[0] || "x").toLowerCase();
    if ("abcde".includes(letter)) return "b";
    if ("fghij".includes(letter)) return "i";
    if ("klmno".includes(letter)) return "n";
    if ("pqrst".includes(letter)) return "g";
    return "o";
  }

  function setBall(termText) {
    textEl.textContent = termText;
    ballEl.dataset.color = colorFor(termText);
    ballEl.classList.remove("reel__ball--idle");
    fitTextToCircle(textEl, termText, { max: 64, min: 22, padFactor: 0.78 });
  }

  // Reusable canvas for measuring real text widths in the actual font.
  let measureCtx = null;
  function getMeasureCtx() {
    if (!measureCtx) {
      const c = document.createElement("canvas");
      measureCtx = c.getContext("2d");
    }
    return measureCtx;
  }

  // Pick a font-size that fits `text` inside a round container without
  // ever splitting a word. Words wrap on spaces only; size shrinks to fit.
  function fitTextToCircle(el, text, opts) {
    const container = el.parentElement; // the ball
    if (!container) return;
    const cw = container.clientWidth || 0;
    const ch = container.clientHeight || 0;
    if (!cw || !ch) return;

    // Effective rectangle inscribed inside the round ball.
    // A square inside a circle of diameter D has side D / sqrt(2) ≈ 0.707D.
    // We allow a touch more (0.82) because text doesn't fill its bounding box,
    // and the JS measurement is conservative.
    const pad = opts.padFactor != null ? opts.padFactor : 0.82;
    const innerW = cw * pad;
    const innerH = ch * pad;

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;
    const lines = words.length === 1 ? 1 : words.length;
    const lineHeight = 1.1;

    const styles = window.getComputedStyle(el);
    const fontFamily = styles.fontFamily || "sans-serif";
    const fontWeight = styles.fontWeight || "700";
    const letterSpacingPx = parseFloat(styles.letterSpacing) || 0;

    const ctx = getMeasureCtx();

    // Measure how wide the longest word would be at 100px so we can scale linearly.
    ctx.font = `${fontWeight} 100px ${fontFamily}`;
    let widestAt100 = 0;
    for (const w of words) {
      const m = ctx.measureText(w).width + letterSpacingPx * Math.max(0, w.length - 1);
      if (m > widestAt100) widestAt100 = m;
    }

    // Width-bound size: the longest single word must fit on its own line.
    const sizeByWidth = (innerW / widestAt100) * 100;
    // Height-bound size: all lines must fit vertically.
    const sizeByHeight = innerH / (lines * lineHeight);

    const target = Math.min(sizeByWidth, sizeByHeight, opts.max);
    const final = Math.max(opts.min, Math.floor(target));
    el.style.fontSize = final + "px";
  }

  function pickRandomRemainingIndex() {
    const i = Math.floor(Math.random() * remaining.length);
    return remaining[i];
  }

  function pickRandomAnyTerm() {
    const i = Math.floor(Math.random() * allTerms.length);
    return allTerms[i];
  }

  // ---------- Spin ----------
  function spin() {
    if (isSpinning) return;
    if (remaining.length === 0) {
      showDone();
      return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    resetBtn.disabled = true;
    hintEl.textContent = "Spinning…";

    // First user gesture — make sure the audio context is alive.
    sounds.warmup();

    // Decide the winner up front (fair: uniform across remaining terms).
    const winnerIndex = pickRandomRemainingIndex();
    const winner = allTerms[winnerIndex];

    reelEl.classList.add("is-spinning");
    reelEl.classList.remove("is-revealing");

    // Cycle through random terms for visual flair.
    const start = performance.now();
    let lastShown = "";
    const tickFn = () => {
      const elapsed = performance.now() - start;
      // pick any random term, but avoid showing the same one twice in a row
      let t;
      let guard = 0;
      do {
        t = pickRandomAnyTerm().term;
        guard++;
      } while (t === lastShown && guard < 5);
      lastShown = t;
      setBall(t);

      // Wheel-of-fortune ratchet: pitch climbs as the wheel slows down,
      // mirroring the visual deceleration.
      const progress = Math.min(1, elapsed / SPIN_MS);
      const pitch = 1400 + progress * 900;
      sounds.tick(pitch);

      if (elapsed < SPIN_MS) {
        // slow down toward the end
        const remainingMs = SPIN_MS - elapsed;
        const nextDelay =
          remainingMs < 600
            ? SHUFFLE_TICK_MS + (600 - remainingMs) * 0.6
            : SHUFFLE_TICK_MS;
        setTimeout(tickFn, nextDelay);
      } else {
        landOn(winnerIndex, winner);
      }
    };
    tickFn();
  }

  function landOn(winnerIndex, winner) {
    setBall(winner.term);
    reelEl.classList.remove("is-spinning");
    reelEl.classList.add("is-revealing");
    sounds.reveal();

    // Remove from remaining and persist.
    remaining = remaining.filter((i) => i !== winnerIndex);
    saveRemaining();
    updateCounter();
    lastTerm = winner;

    // Pop the modal once the landing animation has settled.
    setTimeout(() => {
      openModal(winner);
    }, 650);
  }

  // ---------- Modal ----------
  function openModal(term) {
    modalTerm.textContent = term.term;
    modalShort.textContent = term.short;
    modalDesc.textContent = term.description;
    modalBall.dataset.color = colorFor(term.term);
    applyBallColor(modalBall, term.term);
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    sounds.openCard();
    // Wait for layout before measuring the ball / scaling the prose so the
    // calculations operate on the actual rendered card.
    requestAnimationFrame(() => {
      fitTextToCircle(modalTerm, term.term, { max: 44, min: 16, padFactor: 0.82 });
      fitModalProse();
    });
    modalClose.focus();
  }

  // Pump the heading and description to the largest font size that still
  // lets the whole card fit inside the viewport. Long descriptions get
  // automatically dialled down; short ones go big.
  function fitModalProse() {
    if (modal.hidden) return;
    const viewportH = window.innerHeight;
    const verticalSafety = 40; // 20px modal padding top + 20px bottom
    const maxCardH = viewportH - verticalSafety;

    // Aspirational sizes — JS will shrink only if needed.
    const HEADING_MAX = 56;
    const HEADING_MIN = 22;
    const DESC_MAX = 38;
    const DESC_MIN = 18;

    // Reset to the maximum and let the browser lay it out.
    modalShort.style.fontSize = HEADING_MAX + "px";
    modalDesc.style.fontSize = DESC_MAX + "px";

    // Step 1: shrink the description first (it's usually the bulk of the height).
    let descSize = DESC_MAX;
    while (modalCard.scrollHeight > maxCardH && descSize > DESC_MIN) {
      descSize -= 1;
      modalDesc.style.fontSize = descSize + "px";
    }

    // Step 2: if it still overflows, start pulling the heading down too.
    let headingSize = HEADING_MAX;
    while (modalCard.scrollHeight > maxCardH && headingSize > HEADING_MIN) {
      headingSize -= 1;
      modalShort.style.fontSize = headingSize + "px";
    }
  }

  function applyBallColor(el, term) {
    const c = colorFor(term);
    const palettes = {
      b: ["#6cc6ff", "#1f7af0", "#fff"],
      i: ["#ff9bcb", "#ff2e63", "#fff"],
      n: ["#ffe580", "#ffb703", "#1a0b2e"],
      g: ["#7ef6f3", "#08d9d6", "#1a0b2e"],
      o: ["#c69cff", "#6a2fbf", "#fff"],
    };
    const [from, to, fg] = palettes[c];
    el.style.background = `radial-gradient(circle at 30% 25%, #ffffff, rgba(255,255,255,0) 40%), linear-gradient(135deg, ${from}, ${to})`;
    el.style.color = fg;
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    sounds.close();
    // Re-enable controls for the next spin.
    isSpinning = false;
    spinBtn.disabled = false;
    resetBtn.disabled = false;
    if (remaining.length === 0) {
      hintEl.innerHTML = "All terms called! Hit <strong>Reset round</strong> to play again.";
      showDone();
    } else {
      hintEl.innerHTML =
        "Press <strong>SPIN!</strong> when the room is ready for the next term.";
      spinBtn.focus();
    }
  }

  // ---------- Done overlay ----------
  function showDone() {
    doneModal.hidden = false;
    document.body.style.overflow = "hidden";
    sounds.done();
    doneReset.focus();
  }

  function hideDone() {
    doneModal.hidden = true;
    document.body.style.overflow = "";
  }

  function resetRound() {
    remaining = defaultRemaining();
    saveRemaining();
    updateCounter();
    ballEl.classList.add("reel__ball--idle");
    delete ballEl.dataset.color;
    textEl.textContent = "PRESS SPIN";
    fitTextToCircle(textEl, "PRESS SPIN", { max: 64, min: 22, padFactor: 0.78 });
    hintEl.innerHTML = "Fresh round! Hit <strong>SPIN!</strong> to draw the first term.";
    spinBtn.disabled = false;
    resetBtn.disabled = false;
    isSpinning = false;
    sounds.reset();
    spinBtn.focus();
  }

  // ---------- Mute toggle ----------
  function applyMuted(m, options) {
    sounds.setMuted(m);
    muteBtn.setAttribute("aria-pressed", m ? "true" : "false");
    muteBtn.setAttribute("aria-label", m ? "Unmute sounds" : "Mute sounds");
    muteBtn.title = m ? "Unmute sounds (M)" : "Mute sounds (M)";
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch (_) {}
    // Give a little audible confirmation when turning sounds back on.
    if (!m && options && options.confirmAudible) {
      sounds.warmup();
      sounds.openCard();
    }
  }

  function toggleMute() {
    applyMuted(!sounds.isMuted(), { confirmAudible: true });
  }

  // Restore mute preference from previous sessions.
  let initialMuted = false;
  try {
    initialMuted = localStorage.getItem(MUTE_KEY) === "1";
  } catch (_) {}
  applyMuted(initialMuted);

  muteBtn.addEventListener("click", toggleMute);

  // ---------- Wire up ----------
  spinBtn.addEventListener("click", spin);
  resetBtn.addEventListener("click", () => {
    if (
      remaining.length === allTerms.length ||
      window.confirm(
        "Start a fresh round? This puts every term back in the cage."
      )
    ) {
      resetRound();
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) closeModal();
  });
  modalClose.addEventListener("click", closeModal);

  doneModal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close-done]")) hideDone();
  });
  doneReset.addEventListener("click", () => {
    hideDone();
    resetRound();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!modal.hidden) closeModal();
      else if (!doneModal.hidden) hideDone();
    } else if (e.key === " " || e.code === "Space") {
      // Spacebar = spin, but only when no modal is open and focus isn't in a button (which would double-fire).
      if (modal.hidden && doneModal.hidden && document.activeElement !== spinBtn) {
        e.preventDefault();
        spin();
      }
    } else if (e.key === "m" || e.key === "M") {
      // Quick keyboard mute toggle.
      if (
        document.activeElement &&
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
      ) {
        return;
      }
      toggleMute();
    }
  });

  // ---------- Init ----------
  updateCounter();
  if (remaining.length === 0) {
    hintEl.innerHTML = "All terms called! Hit <strong>Reset round</strong> to play again.";
  }
  // Fit the initial "PRESS SPIN" text once layout (and the web font) is ready.
  const fitInitial = () =>
    fitTextToCircle(textEl, textEl.textContent, { max: 64, min: 22, padFactor: 0.78 });
  requestAnimationFrame(fitInitial);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitInitial);
  }
  // Re-fit on resize so the page stays tidy at any laptop / projector size.
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      fitTextToCircle(textEl, textEl.textContent, { max: 64, min: 22, padFactor: 0.78 });
      if (!modal.hidden) {
        fitTextToCircle(modalTerm, modalTerm.textContent, { max: 44, min: 16, padFactor: 0.82 });
        fitModalProse();
      }
    }, 80);
  });
})();
