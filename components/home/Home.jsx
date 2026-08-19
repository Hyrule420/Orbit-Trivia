"use client";

import React, { useState, useEffect, useRef } from "react";
import { Rocket, Users, Trophy, ChevronRight, Flame, Target, Repeat, User, Volume2, VolumeX, MapPin, Zap, ZapOff, Activity, Download } from "lucide-react";
import { useC } from "../../lib/theme";
import { motionLabel, nextMotionLevel, useMotion } from "../../lib/motion";
import { buzz } from "../../lib/util";
import { SFX } from "../../lib/sfx";
import StarshipHero from "../StarshipCatch";
import Starfield from "../art/Starfield";
import Logo from "../art/Logo";
import Panel from "../ui/Panel";
import Btn from "../ui/Btn";
import Stat from "../ui/Stat";
import InstallHint from "../ui/InstallHint";
import CardCracks from "./CardCracks";
import { CARD_SHARDS, LAUNCH } from "./launch";

export default function Home({ onDaily, onCustom, onEscape, onGeoTrip, geoBest = 0, escapeBest = 0, stats, dailyDone, onSwapTheme, themeName, profile, dayStreak, onOpenProfile, streakMilestone, onDismissMilestone, soundOn, onToggleSound, motionLevel = "full", deviceAsksReduced = false, onCycleMotion, showInstall, canInstall = false, onDismissInstall, androidPrompt }) {
  const C = useC();
  const motion = useMotion();
  const named = (profile.name || "").trim();

  /* The one-shot nudge (showInstall) is dismiss-and-gone-forever by design
     -- see OrbitTrivia.jsx. This is the escape hatch: a permanent header
     icon, independent of that dismissal, so "how do I install this" always
     has an answer instead of only the first time the app decides to ask. */
  const [installOpen, setInstallOpen] = useState(false);
  const installPanelShown = showInstall || installOpen;
  const closeInstall = () => { setInstallOpen(false); onDismissInstall(); };
  /* Closes itself out if the player installs (or the platform stops
     qualifying) while they'd manually reopened it -- otherwise it would
     keep showing "add to home screen" for an app they just added. */
  useEffect(() => { if (!canInstall) setInstallOpen(false); }, [canInstall]);

  /* idle | ignition | ascent | hang | descent | weld */
  const [phase, setPhase] = useState("idle");
  const [hitCards, setHitCards] = useState([]);   // indices the rocket has struck
  const [arms, setArms] = useState("open");       // open | closing | clamped

  const rocketRef = useRef(null);
  const cardRefs = useRef([]);
  const rafRef = useRef(null);
  const timers = useRef([]);

  /* Live flight state for the artwork. A ref, not state, on purpose: the
     Starship's plume, plasma sheath and belly-flop all need the altitude
     every frame, and putting that in Home's state would re-render the
     mode cards sixty times a second mid-shatter. StarshipHero reads this
     from its own rAF instead. */
  const flightRef = useRef({ y: 0, alt: 0 });

  const stopAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => stopAll, []);
  const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));

  const setRocket = (y, scale) => {
    if (rocketRef.current) rocketRef.current.style.transform = `translateY(${y}px) scale(${scale})`;
    /* normalised against one screen height, so "altitude" means the same
       thing on a phone and on a desktop */
    const H = typeof window !== "undefined" ? window.innerHeight : 800;
    flightRef.current.y = y;
    flightRef.current.alt = Math.min(1, -y / (H * 0.85));
  };

  const tapRocket = () => {
    if (phase !== "idle") return;
    stopAll();

    /* Motion Off covers both the player's own setting and the device
       asking for reduced motion — lib/motion.js folds the two together. */
    if (motion.off) { SFX.ui(); buzz(20); return; }

    buzz([20, 30, 20, 40, 80]);
    SFX.engineUp(0.55);
    setPhase("ignition");
    at(LAUNCH.ignitionMs, ascend);
  };

  /* ---- climb: cards break on contact, not on a timer ---- */
  const ascend = () => {
    SFX.engineOff(0.08);
    SFX.liftoff(true);
    buzz([40, 30, 90]);
    setPhase("ascent");

    const H = typeof window !== "undefined" ? window.innerHeight : 800;
    const dist = LAUNCH.exitFactor * H;
    const T = LAUNCH.ascentSec;
    const accel = (2 * dist) / (T * T);           // constant-thrust climb

    const noseStart = rocketRef.current ? rocketRef.current.getBoundingClientRect().top : 0;
    /* the underside of each card, measured once — nothing reflows mid-launch */
    const edges = cardRefs.current.map((n) => (n ? n.getBoundingClientRect().bottom : -1));
    const struck = new Set();
    const t0 = performance.now();
    let lastHit = t0;

    const step = (now) => {
      const t = (now - t0) / 1000;
      const y = -0.5 * accel * t * t;
      setRocket(y, Math.max(0.6, 1 - -y / (dist * 2.4)));

      const nose = noseStart + y;
      edges.forEach((edge, i) => {
        if (edge >= 0 && !struck.has(i) && nose <= edge) {
          struck.add(i);
          lastHit = now;
          SFX.whoosh();
          buzz(28);
          setHitCards((h) => (h.includes(i) ? h : [...h, i]));
        }
      });

      if (t < T) rafRef.current = requestAnimationFrame(step);
      else {
        setRocket(-dist, 0.6);
        /* the last card hit is still coming apart — let it finish before the
           shards switch over to their floating loop, or it snaps mid-throw */
        const settle = Math.max(0, LAUNCH.shatterSec * 1000 - (performance.now() - lastHit));
        at(settle, () => {
          setPhase("hang");
          at(LAUNCH.hangMs, descend);
        });
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  /* ---- the catch: retro-burn to zero right at the arms ---- */
  const descend = () => {
    setPhase("descent");
    SFX.engineUp(0.4);
    setArms("open");

    const H = typeof window !== "undefined" ? window.innerHeight : 800;
    const dist = LAUNCH.exitFactor * H;
    const T = LAUNCH.descentSec;
    const t0 = performance.now();
    let armed = false;

    const step = (now) => {
      const t = Math.min((now - t0) / 1000, T);
      const k = t / T;
      /* (1-k)^2 lands with velocity zero — a suicide burn, not a drop */
      const y = -dist * (1 - k) * (1 - k);
      setRocket(y, 0.6 + 0.4 * k);

      if (!armed && k >= LAUNCH.armsCloseAt) {
        armed = true;
        setArms("closing");
        SFX.ui();
      }

      if (t < T) rafRef.current = requestAnimationFrame(step);
      else {
        setRocket(0, 1);
        SFX.engineOff(0.22);
        buzz([60, 40, 140]);
        setArms("clamped");
        setPhase("weld");                     // caught — now the cards come home
        at(LAUNCH.weldSec * 1000 + 260, () => {
          setPhase("idle");
          setHitCards([]);
          setArms("open");
          if (rocketRef.current) rocketRef.current.style.transform = "";
        });
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const launching = phase !== "idle";

  const milestoneLabel =
    streakMilestone === 7 ? "ONE WEEK STRONG" : streakMilestone === 30 ? "ONE MONTH STRONG" : streakMilestone === 100 ? "CENTURION" : null;
  return (
    <div className="relative min-h-screen p-6 flex flex-col" style={{ background: C.void }}>
      <Starfield />
      <div className="relative z-10 flex flex-col flex-1 max-w-md w-full mx-auto">
        <div className="pt-4 pb-4 flex items-center justify-between">
          <Logo size={32} />
          <div className="flex items-center gap-2">
            {canInstall && (
              <button
                onClick={() => setInstallOpen((v) => !v)}
                aria-label="Add to home screen"
                className="flex items-center justify-center rounded-xl active:scale-90"
                style={{
                  width: 36,
                  height: 34,
                  background: installPanelShown ? `${C.ion}18` : C.hullLight,
                  border: `1px solid ${installPanelShown ? C.ion : `${C.ion}55`}`,
                  transition: "transform .12s, border-color .2s, background .2s",
                }}
              >
                <Download size={14} style={{ color: C.ion }} />
              </button>
            )}
            <button
              onClick={onToggleSound}
              aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
              className="flex items-center justify-center rounded-xl active:scale-90"
              style={{
                width: 36,
                height: 34,
                background: C.hullLight,
                border: `1px solid ${soundOn ? `${C.ion}55` : C.edge}`,
                transition: "transform .12s, border-color .2s",
              }}
            >
              {soundOn
                ? <Volume2 size={14} style={{ color: C.ion }} />
                : <VolumeX size={14} style={{ color: C.dim }} />}
            </button>

            {/* How much spectacle the launch pads are allowed to throw at
                you. Always tappable, including when the device has asked
                for reduced motion — that preference chooses where this
                starts, not where it has to stay. Locking it was a bug:
                every animation went dead and the only way to bring them
                back was greyed out. */}
            <button
              onClick={onCycleMotion}
              aria-label={
                `Motion: ${motionLabel(motionLevel)}${deviceAsksReduced ? " (your device asks for reduced motion)" : ""}.`
                + ` Switch to ${motionLabel(nextMotionLevel(motionLevel))}`
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-90"
              style={{
                background: C.hullLight,
                border: `1px solid ${motionLevel === "full" ? `${C.ion}55` : motionLevel === "subtle" ? `${C.plasma}55` : C.edge}`,
                transition: "transform .12s, border-color .2s",
              }}
            >
              {motionLevel === "full"
                ? <Zap size={14} style={{ color: C.ion }} />
                : motionLevel === "subtle"
                  ? <Activity size={14} style={{ color: C.plasma }} />
                  : <ZapOff size={14} style={{ color: C.dim }} />}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.14em" }}>
                {motionLabel(motionLevel).toUpperCase()}
              </span>
            </button>

            <button
              onClick={onSwapTheme}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-90"
              style={{ background: C.hullLight, border: `1px solid ${C.edge}`, transition: "transform .12s" }}
            >
              <Repeat size={13} style={{ color: C.ion }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.14em" }}>
                {themeName.toUpperCase()}
              </span>
            </button>
          </div>
        </div>

        {installPanelShown && <InstallHint onDismiss={closeInstall} androidPrompt={androidPrompt} />}

        <div className="flex items-center gap-2 pb-6">
          <button
            onClick={onOpenProfile}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl active:scale-95"
            style={{ background: C.hullLight, border: `1px solid ${C.edge}`, transition: "transform .12s" }}
          >
            <User size={14} style={{ color: named ? C.ion : C.dim, flexShrink: 0 }} />
            <span
              className="truncate text-left"
              style={{
                fontFamily: "'Chakra Petch', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: named ? C.star : C.dim,
              }}
            >
              {named || "Set up your profile"}
            </span>
          </button>

          {dayStreak > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl flex-shrink-0"
              style={{ background: `${C.abort}14`, border: `1px solid ${C.abort}55` }}
            >
              <span style={{ fontSize: 13 }}>🔥</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: C.abort }}>
                {dayStreak}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.dim, letterSpacing: "0.12em" }}>
                {dayStreak === 1 ? "DAY" : "DAYS"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {[
            {
              key: "daily",
              onTap: onDaily,
              card: (
                <Panel className="p-5" style={{ borderColor: dailyDone ? C.edge : `${C.ion}66`, boxShadow: dailyDone ? "none" : `0 0 30px ${C.ion}18` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Target size={16} style={{ color: C.ion }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.ion, letterSpacing: "0.18em" }}>
                          {dailyDone ? "COMPLETE" : "TODAY ONLY"}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 20, color: C.star }}>
                        Daily Challenge
                      </div>
                      <div className="text-sm mt-1" style={{ color: C.dim }}>
                        Ten questions. Same ten for everyone. It starts easy.
                      </div>
                    </div>
                    <ChevronRight size={20} style={{ color: C.dim, marginTop: 20 }} />
                  </div>
                </Panel>
              ),
            },
            {
              key: "road",
              onTap: onCustom,
              card: (
                <Panel className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={16} style={{ color: C.plasma }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.plasma, letterSpacing: "0.18em" }}>
                          PASS AND PLAY
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 20, color: C.star }}>
                        Crew Mode
                      </div>
                      <div className="text-sm mt-1" style={{ color: C.dim }}>
                        Everyone takes a turn. You set the rules.
                      </div>
                    </div>
                    <ChevronRight size={20} style={{ color: C.dim, marginTop: 20 }} />
                  </div>
                </Panel>
              ),
            },
            {
              key: "escape",
              onTap: onEscape,
              card: (
                <Panel className="p-5" style={{ borderColor: `${C.abort}44` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame size={16} style={{ color: C.abort }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.abort, letterSpacing: "0.18em" }}>
                          {escapeBest > 0 ? `BEST ${escapeBest.toFixed(1)} KM/S` : "ONE MISS ENDS IT"}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 20, color: C.star }}>
                        Escape Velocity
                      </div>
                      <div className="text-sm mt-1" style={{ color: C.dim }}>
                        Keep answering, keep accelerating. Reach 11.2 km/s to break free.
                      </div>
                    </div>
                    <ChevronRight size={20} style={{ color: C.dim, marginTop: 20 }} />
                  </div>
                </Panel>
              ),
            },
            {
              key: "geotrip",
              onTap: onGeoTrip,
              card: (
                <Panel className="p-5" style={{ borderColor: `${C.thrust}44` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={16} style={{ color: C.thrust }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.thrust, letterSpacing: "0.18em" }}>
                          {geoBest > 0 ? `BEST ${geoBest} PTS` : "NATURE COAST"}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 20, color: C.star }}>
                        Road Trip Florida
                      </div>
                      <div className="text-sm mt-1" style={{ color: C.dim }}>
                        Questions unlock as you drive past real places on US-19.
                      </div>
                    </div>
                    <ChevronRight size={20} style={{ color: C.dim, marginTop: 20 }} />
                  </div>
                </Panel>
              ),
            },
          ].map(({ key, onTap, card }, idx) => {
            const hit = hitCards.includes(idx);
            const welding = phase === "weld";
            return (
              <div key={key} className="relative" ref={(el) => { cardRefs.current[idx] = el; }}>
                {/* the real, tappable card — disappears the instant the nose reaches it */}
                <button
                  onClick={onTap}
                  tabIndex={launching ? -1 : 0}
                  aria-hidden={hit}
                  className="text-left active:scale-95 w-full block"
                  style={{
                    transition: "transform .12s",
                    /* an opacity-0 card is still tappable, so the pointer goes with it */
                    pointerEvents: launching ? "none" : "auto",
                    opacity: hit && !welding ? 0 : 1,
                    animation: hit && welding
                      ? `cardreturn .01s linear ${LAUNCH.weldSec * 0.8}s both`
                      : "none",
                  }}
                >
                  {card}
                </button>

                {/* the same card as four shards, thrown apart and welded back */}
                {hit &&
                  CARD_SHARDS.map((sh, i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        clipPath: sh.clip,
                        WebkitClipPath: sh.clip,
                        willChange: "transform, opacity",
                        "--sx": sh.x,
                        "--sy": sh.y,
                        "--sr": sh.r,
                        "--spread": LAUNCH.spread,
                        "--spread2": LAUNCH.spread2,
                        animation: welding
                          ? `hardSnap ${LAUNCH.weldSec}s cubic-bezier(.25,.85,.35,1) both`
                          : phase === "ascent"
                          ? `extremeShatter ${LAUNCH.shatterSec}s cubic-bezier(.25,.7,.3,1) both`
                          : `zeroFloat 3.4s ease-in-out ${idx * 0.25}s infinite both`,
                      }}
                    >
                      {card}
                      <CardCracks welding={welding} />
                    </div>
                  ))}
              </div>
            );
          })}
        </div>

        {/* ---- Starship on the pad, and the tower that catches it ---- */}
        <div className="flex-1 flex items-end justify-center" style={{ minHeight: 248 }}>
          <StarshipHero
            C={C}
            phase={phase}
            arms={arms}
            shipRef={rocketRef}
            flightRef={flightRef}
            onTap={tapRocket}
          />
        </div>

        <div className="mt-auto pt-8">
          <Panel className="p-4">
            <div className="flex items-center justify-around">
              <Stat icon={<Trophy size={14} />} label="BEST" value={stats.best} color={C.ion} />
              <div style={{ width: 1, height: 32, background: C.edge }} />
              <Stat icon={<Flame size={14} />} label="STREAK" value={stats.streak} color={C.plasma} />
              <div style={{ width: 1, height: 32, background: C.edge }} />
              <Stat icon={<Rocket size={14} />} label="RUNS" value={stats.runs} color={C.thrust} />
            </div>
          </Panel>
        </div>
      </div>

      {milestoneLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "#000000dd", backdropFilter: "blur(4px)" }}>
          <Panel className="p-7 text-center" style={{ maxWidth: 340, borderColor: `${C.abort}66`, boxShadow: `0 0 60px ${C.abort}33` }}>
            <div style={{ fontSize: 44, animation: "chargeup .8s ease-out" }}>🔥</div>
            <div className="mt-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.abort, letterSpacing: "0.28em" }}>
              {streakMilestone} DAY STREAK
            </div>
            <div className="mt-2" style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 28, color: C.star, textShadow: `0 0 26px ${C.abort}` }}>
              {milestoneLabel}
            </div>
            <p className="text-sm mt-3 mb-6" style={{ color: C.dim, lineHeight: 1.6 }}>
              {streakMilestone === 7
                ? "Seven daily challenges in a row. The launch cadence is real."
                : streakMilestone === 30
                ? "Thirty straight days. That's mission-critical consistency."
                : "One hundred consecutive days. Legendary."}
            </p>
            <Btn full onClick={onDismissMilestone}>Keep it going</Btn>
          </Panel>
        </div>
      )}
    </div>
  );
}
