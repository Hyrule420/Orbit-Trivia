"use client";

/* ============================================================
   SOUND
   Every sound here is built from oscillators and noise at the
   moment it plays. Nothing is loaded, nothing is downloaded,
   and the whole kit costs a couple of kilobytes of code instead
   of a couple of megabytes of samples.

   Two things browsers force on us:
   - Audio cannot start until the player has touched the screen,
     so unlock() is wired to the first tap anywhere.
   - Everything must survive an audio system that refuses to
     start at all, hence the try/catch around the whole module.

   Import the object, never its methods: setEnabled calls
   this.engineOff(), so a destructured `const { setEnabled } = SFX`
   throws the moment someone mutes the game.
   ============================================================ */
export const SFX = (() => {
  let ctx = null;
  let bus = null;      // everything runs through a compressor so the big
  let enabled = true;  // liftoff roar can't clip against a stacked chord
  let tune = 1;        // Moon runs bright; Mars sits lower and warmer
  let noiseBuf = null;
  let engineSrc = null;
  let engineGain = null;
  let stuck = 0;

  const build = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 8;
    bus = ctx.createGain();
    bus.gain.value = 0.85;
    bus.connect(comp);
    comp.connect(ctx.destination);
    noiseBuf = null;   // buffers belong to the context that made them
    return true;
  };

  /* Tear it all down and start over. Some iOS builds park a context
     in a state it will never come back from, and the only reliable
     way out is a brand new one. */
  const rebuild = () => {
    try { if (ctx) ctx.close(); } catch (e) { /* already gone */ }
    ctx = null;
    bus = null;
    noiseBuf = null;
    engineSrc = null;
    engineGain = null;
    try { build(); } catch (e) { /* audio unavailable */ }
  };

  const live = () => {
    if (!enabled || typeof window === "undefined") return false;
    try {
      if (!ctx && !build()) return false;
      /* WebKit parks the context in "interrupted" — a state that isn't
         in the spec — whenever the app is backgrounded or the screen
         locks. Checking only for "suspended" meant audio never came
         back once that happened. Resume on anything that isn't running. */
      if (ctx.state !== "running") {
        ctx.resume().catch(() => {});
        stuck += 1;
        if (stuck > 3) { rebuild(); stuck = 0; }
        return false;
      }
      stuck = 0;
      return true;
    } catch (e) {
      return false;
    }
  };

  /* Brown-ish noise: white noise is thin and hissy, this leans low
     and reads as thrust rather than static. */
  const noise = () => {
    if (!noiseBuf) {
      const len = Math.floor(ctx.sampleRate * 2);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + 0.023 * (Math.random() * 2 - 1)) / 1.023;
        d[i] = Math.max(-1, Math.min(1, last * 3.6));
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    return src;
  };

  /* exponentialRamp can never touch zero, so envelopes start and
     end at a value low enough to be inaudible instead. */
  const env = (g, t, peak, attack, dur) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  };

  const blip = (t, freq, peak, dur, type = "sine", glideTo) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq * tune, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo * tune, t + dur);
    env(g, t, peak, 0.006, dur);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  };

  const guard = (fn) => (...args) => {
    if (!live()) return;
    try { fn(ctx.currentTime, ...args); } catch (e) { /* never break the game over a sound */ }
  };

  return {
    unlock() { live(); },
    /* Called when the app comes back to the foreground. iOS may refuse
       to resume outside a gesture, but the next tap retries anyway. */
    revive() {
      if (!enabled || !ctx) { live(); return; }
      try { if (ctx.state !== "running") ctx.resume().catch(() => {}); } catch (e) { /* next tap will retry */ }
    },
    setEnabled(v) {
      enabled = !!v;
      if (!enabled) { try { this.engineOff(0.08); } catch (e) {} }
    },
    setTheme(id) { tune = id === "mars" ? 0.84 : 1; },

    /* soft tap under every button */
    ui: guard((t) => {
      blip(t, 520, 0.05, 0.045, "triangle", 380);
    }),

    /* answer locked in and correct — a rising confirm with an
       electric tail that matches the lightning on screen */
    correct: guard((t) => {
      [[523.25, 0], [783.99, 0.07], [1046.5, 0.14]].forEach(([f, d]) => blip(t + d, f, 0.14, 0.32));
      const n = noise();
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 1.8;
      bp.frequency.setValueAtTime(1700 * tune, t);
      bp.frequency.exponentialRampToValueAtTime(5400 * tune, t + 0.22);
      const g = ctx.createGain();
      env(g, t, 0.055, 0.005, 0.26);
      n.connect(bp); bp.connect(g); g.connect(bus);
      n.start(t); n.stop(t + 0.32);
    }),

    /* wrong answer — a short descending buzz, not a punishment siren */
    wrong: guard((t, timedOut) => {
      const o = ctx.createOscillator();
      const lp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      const dur = timedOut ? 0.62 : 0.42;
      o.type = "sawtooth";
      o.frequency.setValueAtTime(228 * tune, t);
      o.frequency.exponentialRampToValueAtTime((timedOut ? 58 : 76) * tune, t + dur);
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(920, t);
      lp.frequency.exponentialRampToValueAtTime(210, t + dur);
      env(g, t, 0.15, 0.012, dur);
      o.connect(lp); lp.connect(g); g.connect(bus);
      o.start(t); o.stop(t + dur + 0.05);
    }),

    /* final three seconds — climbs in pitch as the clock closes */
    tick: guard((t, urgency = 0) => {
      blip(t, 690 + urgency * 145, 0.085, 0.06, "square");
    }),

    /* the 3-2-1 numbers, dropping a step each time */
    count: guard((t, n) => {
      const base = 190 + n * 46;
      blip(t, base, 0.3, 0.32, "sine", base * 0.52);
      blip(t, base * 4, 0.06, 0.04, "square");
    }),

    /* engines spooling up under the countdown */
    engineUp: guard((t, build = 2.6) => {
      if (engineSrc) return;
      const n = noise();
      const lp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(110, t);
      lp.frequency.linearRampToValueAtTime(430, t + build);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + build);
      n.connect(lp); lp.connect(g); g.connect(bus);
      n.start(t);
      engineSrc = n;
      engineGain = g;
    }),

    engineOff(fade = 0.35) {
      if (!engineSrc || !ctx) return;
      const src = engineSrc, g = engineGain;
      engineSrc = null;
      engineGain = null;
      try {
        const t = ctx.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(Math.max(0.0002, g.gain.value), t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + fade);
        src.stop(t + fade + 0.05);
      } catch (e) { try { src.stop(); } catch (e2) {} }
    },

    /* the big one — full-stack roar with a sub-bass drop underneath */
    liftoff: guard((t, big = true) => {
      const dur = big ? 2.9 : 1.7;
      const n = noise();
      const lp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(190, t);
      lp.frequency.exponentialRampToValueAtTime(1500, t + 0.45);
      lp.frequency.exponentialRampToValueAtTime(280, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(big ? 0.4 : 0.28, t + 0.16);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(lp); lp.connect(g); g.connect(bus);
      n.start(t); n.stop(t + dur + 0.1);
      blip(t, 74, big ? 0.44 : 0.3, dur * 0.72, "sine", 27);
    }),

    /* altitude milestone / streak milestone */
    promo: guard((t) => {
      [[659.25, 0], [880, 0.09], [1318.5, 0.18]].forEach(([f, d]) => blip(t + d, f, 0.12, 0.36, "triangle"));
    }),

    /* SONIC BOOM — the crack that arrives after the rocket has gone.

       Two parts, because that is what a real one is: a very fast
       pressure step, and the low thump of the shock rolling past
       behind it. The step is a noise burst squeezed through a lowpass
       that slams shut in 90 ms; the thump is a sine falling from 58 Hz
       to 24 Hz, which is felt more than heard on a phone speaker but
       does most of the work on anything with a woofer.

       `double` is the Falcon Heavy case: two side boosters touching
       down a fraction apart, which on the real Space Coast arrives as
       one bang immediately followed by another. 380 ms is not the true
       separation — it is the shortest gap that still reads as two
       distinct cracks rather than one ragged one. */
    boom: guard((t, double = false) => {
      const crack = (at, level) => {
        const n = noise();
        const lp = ctx.createBiquadFilter();
        const g = ctx.createGain();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(2400, at);
        lp.frequency.exponentialRampToValueAtTime(160, at + 0.09);
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(level, at + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.42);
        n.connect(lp); lp.connect(g); g.connect(bus);
        n.start(at); n.stop(at + 0.5);
        blip(at, 58, level * 0.85, 0.5, "sine", 24);
      };
      crack(t, 0.34);
      if (double) crack(t + 0.38, 0.27);
    }),

    /* The ground shaking, under everything else. Deliberately almost
       sub-audible: it is there to make the screen shake feel like it
       has a cause, not to be noticed on its own. */
    rumble: guard((t, dur = 1.6) => {
      const n = noise();
      const lp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(90, t);
      lp.frequency.linearRampToValueAtTime(46, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.26, t + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(lp); lp.connect(g); g.connect(bus);
      n.start(t); n.stop(t + dur + 0.1);
    }),

    /* Turning the carousel of questions at a landmark. Pitched by
       direction — up as you go forward through them, down as you come
       back — so the movement is audible as well as visible. Short and
       dry on purpose: this fires every time a thumb moves, and anything
       with a tail would smear into itself. */
    swipe: guard((t, forward = true) => {
      const from = forward ? 430 : 620;
      const to = forward ? 640 : 420;
      blip(t, from, 0.05, 0.09, "triangle", to);
      const n = noise();
      const bp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      bp.type = "bandpass";
      bp.Q.value = 2.2;
      bp.frequency.setValueAtTime(from * 3, t);
      bp.frequency.exponentialRampToValueAtTime(to * 3, t + 0.1);
      env(g, t, 0.03, 0.004, 0.11);
      n.connect(bp); bp.connect(g); g.connect(bus);
      n.start(t); n.stop(t + 0.16);
    }),

    /* ============================================================
       FOUR SATELLITES, FOUR DECADES.

       These play in launch order at Satellite Beach, and the whole
       point of them is the distance travelled between the first and
       the last: three slow analogue beeps in 1957, a wall of data
       today. Keep them sounding like different eras — if they ever
       start sounding like one another, the sequence has lost its
       argument.
       ============================================================ */

    /* Sputnik. Three plain tone bursts, evenly spaced, no effects on
       them at all. What frightened people in 1957 was not that it was
       sophisticated — it was that anyone with a shortwave set could
       hear it going over, and there was nothing to it but a beep. */
    beacon: guard((t, reps = 3, gap = 0.24) => {
      for (let i = 0; i < reps; i++) blip(t + i * gap, 1046, 0.09, 0.1, "sine");
    }),

    /* Explorer 1. A scratchy analogue downlink: narrow-bandpassed noise
       whose gain is STEPPED rather than swept, so it chatters instead
       of hissing, with a few irregular ticks over the top standing in
       for the Geiger counter it actually carried — the instrument that
       found the Van Allen belts on this very flight. */
    telemetry: guard((t, dur = 0.6) => {
      const n = noise();
      const bp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      bp.type = "bandpass";
      bp.Q.value = 3.5;
      bp.frequency.setValueAtTime(880, t);
      bp.frequency.linearRampToValueAtTime(1120, t + dur);
      const steps = 8;
      for (let i = 0; i < steps; i++) {
        g.gain.setValueAtTime(i % 3 === 0 ? 0.02 : 0.085, t + (i / steps) * dur);
      }
      g.gain.setValueAtTime(0.0001, t + dur);
      n.connect(bp); bp.connect(g); g.connect(bus);
      n.start(t); n.stop(t + dur + 0.05);
      [0.09, 0.24, 0.41].forEach((d, i) => blip(t + d, 640 + i * 90, 0.045, 0.028, "square"));
    }),

    /* Telstar. A bright rising major figure under a short shimmer —
       the sound of 1962 deciding the future was going to be wonderful.
       A nod at the instrumental named after it, not a quote of it. */
    spaceAge: guard((t) => {
      [[587.33, 0], [739.99, 0.1], [987.77, 0.2], [1174.7, 0.32]].forEach(([f, d]) =>
        blip(t + d, f, 0.12, 0.34, "triangle")
      );
      const n = noise();
      const bp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      bp.type = "bandpass";
      bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(2200, t);
      bp.frequency.exponentialRampToValueAtTime(6200, t + 0.4);
      env(g, t, 0.038, 0.02, 0.44);
      n.connect(bp); bp.connect(g); g.connect(bus);
      n.start(t); n.stop(t + 0.5);
    }),

    /* Starlink. A fast cascade of very short chirps climbing in pitch,
       closed with a bright sparkle. Deliberately the exact opposite of
       beacon() above: where that is three slow beeps anyone could
       count, this is more signal than you can follow. */
    dataBurst: guard((t, reps = 10) => {
      for (let i = 0; i < reps; i++) {
        const f = 1400 + i * 95;
        blip(t + i * 0.045, f, 0.055, 0.03, "square", f * 1.4);
      }
      const tail = noise();
      const bp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      bp.type = "bandpass";
      bp.Q.value = 1.6;
      bp.frequency.setValueAtTime(3000, t);
      bp.frequency.exponentialRampToValueAtTime(9000, t + 0.3);
      env(g, t, 0.045, 0.01, 0.36);
      tail.connect(bp); bp.connect(g); g.connect(bus);
      tail.start(t); tail.stop(t + 0.42);
    }),

    /* A wave standing up, breaking, and washing out.

       Surf is filtered noise and nothing else — no oscillator anywhere
       in here — because that is genuinely what it is: broadband hiss
       shaped by a filter that opens as the wave stands up and closes as
       it drains back. The two stages are one noise source through one
       bandpass, swept twice, which is cheaper than layering samples and
       sounds closer than a sine ever would. */
    wave: guard((t, dur = 2.4) => {
      const n = noise();
      const bp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      bp.type = "bandpass";
      bp.Q.value = 0.7;
      /* low and rolling while it builds, bright as it breaks, then
         dark again as it drains off the sand */
      bp.frequency.setValueAtTime(240, t);
      bp.frequency.exponentialRampToValueAtTime(1700, t + dur * 0.42);
      bp.frequency.exponentialRampToValueAtTime(320, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + dur * 0.3);
      g.gain.exponentialRampToValueAtTime(0.2, t + dur * 0.46);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(bp); bp.connect(g); g.connect(bus);
      n.start(t); n.stop(t + dur + 0.15);
    }),

    /* rocket passing through something */
    whoosh: guard((t) => {
      const n = noise();
      const bp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      bp.type = "bandpass";
      bp.Q.value = 1.1;
      bp.frequency.setValueAtTime(320, t);
      bp.frequency.exponentialRampToValueAtTime(2600, t + 0.3);
      env(g, t, 0.16, 0.05, 0.38);
      n.connect(bp); bp.connect(g); g.connect(bus);
      n.start(t); n.stop(t + 0.45);
    }),
  };
})();
