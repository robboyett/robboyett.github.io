// Synthesised game-show sound pack for AI Bingo.
// Uses the Web Audio API directly so we don't ship any audio files —
// the whole "soundtrack" is generated live in the browser.
(function () {
  "use strict";

  let ctx = null;
  let master = null;
  let muted = false;

  function ensureCtx() {
    if (muted) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") {
      // Browsers require a user gesture before audio can play; resume on first call.
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  // Quick ADSR-ish envelope helper that plays a single oscillator burst.
  function blip(freq, dur, opts) {
    const c = ensureCtx();
    if (!c) return;
    opts = opts || {};
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (opts.toFreq) {
      osc.frequency.exponentialRampToValueAtTime(
        opts.toFreq,
        c.currentTime + dur
      );
    }
    osc.connect(gain).connect(master);

    const peak = opts.peak != null ? opts.peak : 0.25;
    const attack = opts.attack != null ? opts.attack : 0.005;
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  // Wheel-of-fortune style ratchet click. Pitch can shift to convey speed.
  function tick(pitch) {
    const c = ensureCtx();
    if (!c) return;
    const f = pitch || 1800;
    const now = c.currentTime;

    // Short noise burst for the "clack".
    const len = Math.floor(c.sampleRate * 0.025);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const noise = c.createBufferSource();
    noise.buffer = buf;
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1200;
    const ng = c.createGain();
    ng.gain.value = 0.18;
    noise.connect(hp).connect(ng).connect(master);
    noise.start(now);

    // Pitched plink on top so the tick feels musical / wheel-like.
    const osc = c.createOscillator();
    const og = c.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 0.5, now + 0.04);
    osc.connect(og).connect(master);
    og.gain.setValueAtTime(0.0001, now);
    og.gain.exponentialRampToValueAtTime(0.12, now + 0.003);
    og.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Triumphant bell-ding when the ball lands.
  function reveal() {
    const c = ensureCtx();
    if (!c) return;
    // Major-third bell stack.
    blip(1318.5, 0.7, { type: "sine", peak: 0.35, attack: 0.005 }); // E6
    blip(1760.0, 0.7, { type: "sine", peak: 0.25, attack: 0.005 }); // A6
    setTimeout(() => {
      blip(1975.5, 0.6, { type: "sine", peak: 0.3 }); // B6
      blip(2637.0, 0.6, { type: "sine", peak: 0.2 }); // E7
    }, 140);
    // Sparkle on top.
    setTimeout(() => sparkle(4), 80);
  }

  // Ascending arpeggio when the term card slides up.
  function openCard() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      setTimeout(
        () => blip(f, 0.22, { type: "triangle", peak: 0.22 }),
        i * 55
      );
    });
  }

  function close() {
    blip(660, 0.08, { type: "sine", peak: 0.18 });
    setTimeout(() => blip(440, 0.08, { type: "sine", peak: 0.14 }), 60);
  }

  // Big slot-machine jackpot fanfare when every term has been called.
  function done() {
    const notes = [
      523.25, 659.25, 783.99, 1046.5, 1318.5, 1568.0, 2093.0,
    ]; // C5 E5 G5 C6 E6 G6 C7
    notes.forEach((f, i) => {
      setTimeout(
        () =>
          blip(f, 0.28, {
            type: "triangle",
            peak: 0.28,
            attack: 0.006,
          }),
        i * 90
      );
    });
    // Sustained shimmer over the top.
    setTimeout(() => {
      blip(2093.0, 1.2, { type: "sine", peak: 0.18 });
      blip(2637.0, 1.2, { type: "sine", peak: 0.14 });
      sparkle(8);
    }, 700);
  }

  function reset() {
    blip(440, 0.08, { type: "square", peak: 0.18, toFreq: 660 });
    setTimeout(
      () => blip(660, 0.12, { type: "square", peak: 0.18, toFreq: 880 }),
      90
    );
  }

  // Tinkly "sparkle" — a flurry of randomised high notes.
  function sparkle(count) {
    const c = ensureCtx();
    if (!c) return;
    const baseNotes = [1568, 1760, 1975, 2093, 2349, 2637, 3136];
    for (let i = 0; i < count; i++) {
      const f = baseNotes[Math.floor(Math.random() * baseNotes.length)];
      setTimeout(() => {
        blip(f, 0.18, {
          type: "sine",
          peak: 0.12 + Math.random() * 0.08,
          attack: 0.002,
        });
      }, Math.floor(Math.random() * 400));
    }
  }

  function setMuted(m) {
    muted = !!m;
    if (master) master.gain.value = muted ? 0 : 0.55;
  }

  function isMuted() {
    return muted;
  }

  // Warm up the audio context on a user gesture (the first SPIN click does this).
  function warmup() {
    ensureCtx();
  }

  window.AI_BINGO_SOUNDS = {
    tick,
    reveal,
    openCard,
    close,
    done,
    reset,
    sparkle,
    setMuted,
    isMuted,
    warmup,
  };
})();
