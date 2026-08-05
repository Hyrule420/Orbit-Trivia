import React, { useState, useEffect, useRef, useCallback } from "react";
import { Rocket, Users, Trophy, X, Pause, ChevronRight, Check, Flame, Target, Repeat, User, Volume2, VolumeX } from "lucide-react";
import StarshipHero from "@/components/StarshipCatch";
import { THEMES, ThemeCtx, useC } from "@/lib/theme";
import { QUESTIONS, TIER_META, CATEGORIES, TESLA_MODELS } from "@/lib/questions";
import { shuffle, buzz } from "@/lib/util";
import { SFX } from "@/lib/sfx";
import { storage } from "@/lib/storage";
import { todaySeed, todayKey, liveDayStreak, bumpDayStreak } from "@/lib/day";
import { ESCAPE, escapeTimer, buildEscapeDeck } from "@/lib/escape";
import { isInstalled, isIOSSafari } from "@/lib/platform";
import MoonBody from "@/components/art/MoonBody";
import MarsBody from "@/components/art/MarsBody";
import Starfield from "@/components/art/Starfield";
import Logo from "@/components/art/Logo";
import TrajectoryRail from "@/components/art/TrajectoryRail";
import Lightning from "@/components/art/Lightning";
import LaunchCelebration from "@/components/art/LaunchCelebration";
import Btn from "@/components/ui/Btn";
import Panel from "@/components/ui/Panel";
import Stat from "@/components/ui/Stat";
import Section from "@/components/ui/Section";
import Slider from "@/components/ui/Slider";
import DrivingCheck from "@/components/ui/DrivingCheck";
import InstallHint from "@/components/ui/InstallHint";
import Handoff from "@/components/ui/Handoff";
import PlanetPicker from "@/components/screens/PlanetPicker";
import ProfileScreen from "@/components/screens/ProfileScreen";
import CustomSetup from "@/components/screens/CustomSetup";
import CountdownLaunch from "@/components/screens/CountdownLaunch";
import Results from "@/components/screens/Results";
import EscapeResults from "@/components/screens/EscapeResults";


/* ============================================================
   HELPERS
   ============================================================ */


/* Four jagged shards that together tile a card. Shared fracture edges,
   so when they separate the background shows through real gaps. */
const CARD_SHARDS = [
  { clip: "polygon(0% 0%, 48% 0%, 52% 20%, 46% 45%, 30% 40%, 14% 48%, 0% 44%)", x: "-14px", y: "-12px", r: "-3deg" },
  { clip: "polygon(48% 0%, 100% 0%, 100% 66%, 84% 70%, 68% 62%, 51% 70%, 46% 45%, 52% 20%)", x: "16px", y: "-9px", r: "2.5deg" },
  { clip: "polygon(0% 44%, 14% 48%, 30% 40%, 46% 45%, 51% 70%, 49% 100%, 0% 100%)", x: "-12px", y: "12px", r: "2deg" },
  { clip: "polygon(51% 70%, 68% 62%, 84% 70%, 100% 66%, 100% 100%, 49% 100%)", x: "14px", y: "11px", r: "-2.5deg" },
];


/* ============================================================
   HOME LAUNCH
   The ascent and the catch are driven by requestAnimationFrame,
   not by CSS keyframes, because a card has to break on the frame
   the nose actually crosses it — a fixed delay drifts on every
   different screen height. Everything tunable lives here.
   ============================================================ */
const LAUNCH = {
  ignitionMs: 850,     // hold-down before release
  ascentSec: 1.55,     // pad to out-of-frame
  hangMs: 1500,        // debris floating, rocket out of sight
  descentSec: 2.2,     // re-entry, retro-burn, catch
  exitFactor: 1.9,     // screen heights travelled before turnaround
  armsCloseAt: 0.68,   // fraction of the descent when the chopsticks move
  shatterSec: 1.0,     // one card coming apart
  weldSec: 0.95,       // one card welding back
  spread: 3.2,         // debris throw, x the shard's base offset
  spread2: 3.6,        // drift limit while floating
};

/* the shared fracture edges of CARD_SHARDS, as one path in a
   0..100 box — drawn over a broken card so the cracks can glow */
const CRACK_PATH =
  "M48 0 L52 20 L46 45 M0 44 L14 48 L30 40 L46 45 L51 70 L68 62 L84 70 L100 66 M51 70 L49 100";

/* Rendered INSIDE a shard, so the shard's clip-path cuts the path down to
   that piece's own broken edge — and the glow travels with the piece.
   Each side shows half a stroke; when the pieces meet, the halves make one
   full-brightness seam, which is what reads as a weld. */
function CardCracks({ welding }) {
  const C = useC();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 pointer-events-none"
      style={{
        width: "100%",
        height: "100%",
        animation: welding
          ? `weldSeam ${LAUNCH.weldSec}s ease-out both`
          : "edgeCool .35s ease-out both",
      }}
    >
      {/* outer bloom, then the hot core — both straddle the fracture line */}
      <path d={CRACK_PATH} fill="none" stroke={C.ion} strokeWidth={7} opacity={0.5}
            vectorEffect="non-scaling-stroke" style={{ filter: "blur(3px)" }} />
      <path d={CRACK_PATH} fill="none" stroke={C.star} strokeWidth={3} opacity={0.75}
            vectorEffect="non-scaling-stroke" style={{ filter: "blur(1px)" }} />
      <path d={CRACK_PATH} fill="none" stroke="#FFFFFF" strokeWidth={1.4}
            vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Home({ onDaily, onCustom, onEscape, escapeBest = 0, stats, dailyDone, onSwapTheme, themeName, profile, dayStreak, onOpenProfile, streakMilestone, onDismissMilestone, soundOn, onToggleSound, showInstall, onDismissInstall, androidPrompt }) {
  const C = useC();
  const named = (profile.name || "").trim();

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

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { SFX.ui(); buzz(20); return; }

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
                        Ten questions. Same ten for everyone today.
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
                        Road Trip Mode
                      </div>
                      <div className="text-sm mt-1" style={{ color: C.dim }}>
                        Everyone in the car takes a turn. You set the rules.
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
          {showInstall && <InstallHint onDismiss={onDismissInstall} androidPrompt={androidPrompt} />}
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


function Game({ config, mode, onFinish, onQuit }) {
  const C = useC();
  const { players, timer, sameQ, count } = config;
  const totalRounds = count;

  const [qIndex, setQIndex] = useState(0);
  const [pIndex, setPIndex] = useState(0);
  const [scores, setScores] = useState(() => players.map(() => 0));
  const [correctCounts, setCorrectCounts] = useState(() => players.map(() => 0));
  const [streaks, setStreaks] = useState(() => players.map(() => 0));
  const [bestStreaks, setBestStreaks] = useState(() => players.map(() => 0));
  const [phase, setPhase] = useState("countdown");
  const [picked, setPicked] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timer);
  const [paused, setPaused] = useState(false);
  const [shake, setShake] = useState(false);
  const [zap, setZap] = useState(false);
  const [promo, setPromo] = useState(null);
  const [gainInfo, setGainInfo] = useState(null);
  const [pulse, setPulse] = useState(null);

  /* Escape Velocity run state. Unused in the other two modes. */
  const isEscape = mode === "escape";
  const [velocity, setVelocity] = useState(0);
  const [mult, setMult] = useState(1);
  const [kmGain, setKmGain] = useState(null);
  const [escapeBig, setEscapeBig] = useState(null);
  const [dead, setDead] = useState(false);
  const escapeMarkRef = useRef(0);

  /* The clock is fixed in Daily and Road Trip, but tightens every
     question in an Escape run. */
  const liveTimer = isEscape ? escapeTimer(qIndex) : timer;

  const milestoneRef = useRef(null);
  if (milestoneRef.current === null) milestoneRef.current = players.map(() => 0);

  const wasWrongRef = useRef(null);
  if (wasWrongRef.current === null) wasWrongRef.current = players.map(() => false);

  const tickedRef = useRef(null);

  const deckRef = useRef(null);
  if (deckRef.current === null) {
    if (isEscape) {
      /* Already laddered by difficulty — shuffling here would undo it. */
      deckRef.current = [config.pool.slice(0, totalRounds)];
    } else if (sameQ || players.length === 1) {
      const shared = shuffle(config.pool, mode === "daily" ? todaySeed() : undefined).slice(0, totalRounds);
      deckRef.current = players.map(() => shared);
    } else {
      const big = shuffle(config.pool);
      deckRef.current = players.map((_, i) => {
        const out = [];
        for (let r = 0; r < totalRounds; r++) out.push(big[(r * players.length + i) % big.length]);
        return out;
      });
    }
  }

  const question = deckRef.current[pIndex][qIndex];
  const shuffledOpts = React.useMemo(() => (question ? shuffle(question.o, question.q.length * 7 + qIndex) : []), [question, qIndex]);

  const lockIn = useCallback(
    (choice) => {
      if (picked !== null) return;
      const isRight = choice === question.a;
      const timedOut = choice === null;
      setPicked(choice ?? "__timeout__");
      if (isRight) {
        setZap(true);
        setTimeout(() => setZap(false), 750);
        buzz(30);
        SFX.correct();
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 420);
        buzz(timedOut ? 90 : [25, 60, 25]);
        SFX.wrong(timedOut);
      }
      setPulse(isRight ? "good" : "bad");
      setTimeout(() => setPulse(null), 260);
      const speedBonus = isRight ? Math.round(TIER_META[question.d].points * 0.5 * (timeLeft / liveTimer)) : 0;
      const gain = isRight ? TIER_META[question.d].points + speedBonus : 0;
      const comeback = isRight && wasWrongRef.current[pIndex];
      wasWrongRef.current[pIndex] = !isRight;
      setGainInfo(isRight ? { base: TIER_META[question.d].points, bonus: speedBonus, comeback } : null);

      if (isEscape) {
        if (isRight) {
          /* Answering fast is worth up to half as much again. */
          const speed = 1 + 0.5 * (timeLeft / liveTimer);
          const add = ESCAPE.gain[question.d] * mult * speed;
          const nv = velocity + add;
          setVelocity(nv);
          setMult((m) => Math.round((m + ESCAPE.multStep) * 100) / 100);
          setKmGain({ km: add, mult, speed: Math.round((speed - 1) * 100) });
          for (const mk of ESCAPE.marks) {
            if (nv >= mk.at && escapeMarkRef.current < mk.at) {
              escapeMarkRef.current = mk.at;
              if (mk.big) {
                setEscapeBig(mk.label);   // breaking free earns the full launch
              } else {
                SFX.promo();
                setPromo(mk.label);
                setTimeout(() => setPromo(null), 1700);
              }
            }
          }
        } else {
          setDead(true);   // one wrong answer ends the run
        }
      }

      if (isRight && !isEscape) {
        const maxS = totalRounds * 300 * 1.5;
        const np = Math.min(1, (scores[pIndex] + gain) / (maxS * 0.6));
        const marks = [[0.33, "ORBIT REACHED"], [0.66, "MARTIAN REACHED"], [1, "ESCAPE VELOCITY"]];
        for (const [at, label] of marks) {
          if (np >= at && milestoneRef.current[pIndex] < at) {
            milestoneRef.current[pIndex] = at;
            SFX.promo();
            setPromo(label);
            setTimeout(() => setPromo(null), 1700);
          }
        }
      }

      setScores((s) => s.map((v, i) => (i === pIndex ? v + gain : v)));
      setCorrectCounts((s) => s.map((v, i) => (i === pIndex ? v + (isRight ? 1 : 0) : v)));
      setStreaks((s) => {
        const next = s.map((v, i) => (i === pIndex ? (isRight ? v + 1 : 0) : v));
        setBestStreaks((b) => b.map((v, i) => Math.max(v, next[i])));
        return next;
      });
      setPhase("revealed");
    },
    [picked, question, timeLeft, liveTimer, pIndex, isEscape, mult, velocity]
  );

  useEffect(() => {
    if (phase !== "asking" || paused) return;
    if (timeLeft <= 0) {
      lockIn(null);
      return;
    }
    /* One tick per second in the last three. The ref stops a pause
       or a re-render from firing the same second twice. */
    if (timeLeft <= 3 && tickedRef.current !== timeLeft) {
      tickedRef.current = timeLeft;
      SFX.tick(3 - timeLeft);
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, paused, lockIn]);

  const advance = () => {
    if (isEscape) {
      if (dead || qIndex === totalRounds - 1) {
        onFinish({
          players,
          scores,
          correctCounts,
          bestStreaks,
          totalRounds: qIndex + 1,
          escape: true,
          velocity,
          cleared: correctCounts[0],
          peakMult: mult,
          escaped: velocity >= 11.2,
        });
        return;
      }
      setPicked(null);
      setGainInfo(null);
      setKmGain(null);
      setTimeLeft(escapeTimer(qIndex + 1));
      tickedRef.current = null;
      setQIndex((v) => v + 1);
      setPhase("asking");
      return;
    }

    const lastPlayer = pIndex === players.length - 1;
    const lastQuestion = qIndex === totalRounds - 1;
    if (lastPlayer && lastQuestion) {
      onFinish({ players, scores, correctCounts, bestStreaks, totalRounds });
      return;
    }
    setPicked(null);
    setGainInfo(null);
    setTimeLeft(timer);
    tickedRef.current = null;
    if (lastPlayer) {
      setPIndex(0);
      setQIndex((v) => v + 1);
    } else {
      setPIndex((v) => v + 1);
    }
    setPhase(players.length > 1 ? "handoff" : "asking");
  };

  if (phase === "countdown") {
    return (
      <CountdownLaunch
        onDone={() => {
          setTimeLeft(isEscape ? escapeTimer(0) : timer);
          tickedRef.current = null;
          setPhase(players.length > 1 ? "handoff" : "asking");
        }}
      />
    );
  }

  if (phase === "handoff") {
    return (
      <Handoff
        name={players[pIndex]}
        roundNum={qIndex + 1}
        totalRounds={totalRounds}
        onReady={() => {
          setTimeLeft(isEscape ? escapeTimer(0) : timer);
          tickedRef.current = null;
          setPhase("asking");
        }}
      />
    );
  }

  const tierColor = C[TIER_META[question.d].key];
  const answered = picked !== null;
  const timedOut = picked === "__timeout__";
  const gotIt = picked === question.a;
  const maxScore = totalRounds * 300 * 1.5;
  const progress = isEscape
    ? Math.min(1, velocity / 11.2)
    : Math.min(1, scores[pIndex] / (maxScore * 0.6));

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: C.void }}>
      <Starfield comets={false} />
      {escapeBig && (
        <LaunchCelebration
          kicker="11.2 KM/S — YOU'RE FREE"
          title="ESCAPE VELOCITY"
          onDone={() => setEscapeBig(null)}
        />
      )}
      <div
        className="relative z-10 flex-1 flex flex-col max-w-md w-full mx-auto p-5"
        style={{ animation: shake ? "screenshake .4s ease-out" : "none" }}
      >
        {pulse && (
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: 40,
              boxShadow: `inset 0 0 60px ${pulse === "good" ? C.thrust : C.abort}`,
              animation: "edgepulse .26s ease-out both",
            }}
          />
        )}
        {promo && (
          <div className="absolute inset-x-0 z-30 text-center pointer-events-none" style={{ top: "36%" }}>
            <div style={{ animation: "promoPop 1.7s ease-out both" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.ion, letterSpacing: "0.3em" }}>
                {isEscape ? "VELOCITY MILESTONE" : "ALTITUDE MILESTONE"}
              </div>
              <div
                style={{
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontWeight: 700,
                  fontSize: 30,
                  color: C.star,
                  textShadow: `0 0 28px ${C.ion}`,
                  marginTop: 4,
                }}
              >
                {promo}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-5">
          <button onClick={onQuit} className="p-2 -ml-2 active:scale-90">
            <X size={20} style={{ color: C.dim }} />
          </button>
          <div className="text-center">
            {isEscape ? (
              <>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 19, color: velocity >= 11.2 ? C.thrust : C.star, textShadow: velocity >= 11.2 ? `0 0 16px ${C.thrust}` : "none", lineHeight: 1.1 }}>
                  {velocity.toFixed(1)}
                  <span style={{ fontSize: 10, color: C.dim, marginLeft: 3, letterSpacing: "0.1em" }}>KM/S</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.14em", marginTop: 2 }}>
                  <span style={{ color: mult >= 2 ? C.plasma : C.dim }}>×{mult.toFixed(2)}</span>
                  {" · "}{correctCounts[0]} CLEARED
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, fontSize: 15, color: C.star }}>{players[pIndex]}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.16em" }}>
                  {qIndex + 1} / {totalRounds}
                  {streaks[pIndex] >= 2 && (
                    <span style={{ color: streaks[pIndex] >= 6 ? C.abort : C.plasma }}>
                      {" · "}{streaks[pIndex]}
                      {"🔥".repeat(Math.min(3, Math.floor(streaks[pIndex] / 2)))}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <button onClick={() => setPaused((p) => !p)} className="p-2 -mr-2 active:scale-90" disabled={answered}>
            <Pause size={20} style={{ color: answered ? C.edge : paused ? C.ion : C.dim }} />
          </button>
        </div>

        <div className="rounded-full mb-2 overflow-hidden" style={{ height: 4, background: C.edge }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${(timeLeft / liveTimer) * 100}%`,
              background: timeLeft / liveTimer > 0.4 ? `linear-gradient(90deg, ${C.ion}, ${C.plasma})` : C.abort,
              transition: "width 1s linear, background .3s",
              animation: !answered && timeLeft <= 3 ? "urgent .6s ease-in-out infinite" : "none",
            }}
          />
        </div>

        {/* close-call countdown — fixed height so the layout never jumps */}
        <div className="text-center mb-3" style={{ height: 28 }}>
          {!answered && timeLeft <= 3 && timeLeft > 0 && (
            <span
              key={timeLeft}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 25,
                fontWeight: 700,
                color: C.abort,
                display: "inline-block",
                textShadow: `0 0 16px ${C.abort}`,
                animation: "countIn .5s cubic-bezier(.2,.8,.2,1) both",
              }}
            >
              {timeLeft}
            </span>
          )}
        </div>

        <div className="flex gap-3 flex-1">
          <TrajectoryRail progress={progress} heat={streaks[pIndex]} />

          <div className="flex-1 flex flex-col">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-2 py-1 rounded-md"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    color: tierColor,
                    background: `${tierColor}18`,
                    border: `1px solid ${tierColor}44`,
                  }}
                >
                  {question.d.toUpperCase()}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, letterSpacing: "0.14em" }}>
                  {question.c.toUpperCase()}
                </span>
              </div>
              <h2 style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 20, lineHeight: 1.4, color: C.star, fontWeight: 500 }}>
                {question.q}
              </h2>
            </div>

            <div className="flex flex-col gap-2.5 mb-4">
              {shuffledOpts.map((opt) => {
                const isCorrect = opt === question.a;
                const isPicked = opt === picked;
                let bg = C.hull, border = C.edge, color = C.star, glow = "none";
                if (answered) {
                  if (isCorrect) {
                    bg = `${C.thrust}1E`; border = C.thrust; color = C.thrust;
                    glow = `0 0 26px ${C.thrust}55`;
                  } else if (isPicked) {
                    bg = `${C.abort}1E`; border = C.abort; color = C.abort;
                  } else {
                    color = C.dim; bg = C.hull;
                  }
                }
                return (
                  <div key={opt} className="relative">
                    {isCorrect && <Lightning active={zap} />}
                    <button
                      onClick={() => lockIn(opt)}
                      disabled={answered || paused}
                      className="w-full p-4 rounded-xl text-left active:scale-95 relative"
                      style={{
                        background: bg,
                        border: `1px solid ${border}`,
                        color,
                        boxShadow: glow,
                        opacity: answered && !isCorrect && !isPicked ? 0.4 : 1,
                        transform: isPicked && !isCorrect && shake ? "translateX(6px)" : "none",
                        transition: "all .28s cubic-bezier(.2,.8,.2,1)",
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: 15,
                        lineHeight: 1.4,
                        animation: isCorrect && zap ? "chargeup .6s ease-out" : "none",
                      }}
                    >
                      <span className="flex items-center gap-3">
                        {answered && isCorrect && <Check size={16} style={{ flexShrink: 0 }} />}
                        {answered && isPicked && !isCorrect && <X size={16} style={{ flexShrink: 0 }} />}
                        {opt}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {answered && (
              <div className="mt-auto">
                <div
                  className="p-4 rounded-xl mb-3 text-center relative"
                  style={{ background: gotIt ? `${C.thrust}12` : `${C.abort}12`, border: `1px solid ${gotIt ? C.thrust : C.abort}44` }}
                >
                  <div
                    style={{
                      fontFamily: "'Chakra Petch', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: gotIt ? (gainInfo?.comeback ? C.plasma : C.thrust) : C.abort,
                      textShadow: gotIt && gainInfo?.comeback ? `0 0 18px ${C.plasma}` : "none",
                    }}
                  >
                    {gotIt
                      ? isEscape
                        ? "Still climbing"
                        : gainInfo?.comeback
                        ? "Back in it"
                        : "Nailed it"
                      : isEscape
                      ? "Gravity wins"
                      : timedOut
                      ? "Out of time"
                      : "Not quite"}
                  </div>
                  {isEscape && gotIt && kmGain && (
                    <>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.star, marginTop: 4 }}>
                        +{kmGain.km.toFixed(2)} km/s
                        <span style={{ color: C.dim }}>{"  ×"}{kmGain.mult.toFixed(2)}</span>
                      </div>
                      {kmGain.speed > 0 && (
                        <div
                          className="absolute inset-x-0 pointer-events-none"
                          style={{ top: 6, animation: "speedFloat 1.5s cubic-bezier(.2,.8,.2,1) both" }}
                        >
                          <span
                            className="px-2 py-1 rounded-md"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              color: C.ion,
                              background: `${C.ion}1A`,
                              border: `1px solid ${C.ion}66`,
                              textShadow: `0 0 12px ${C.ion}`,
                            }}
                          >
                            +{kmGain.speed}% SPEED
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {isEscape && !gotIt && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.dim, marginTop: 4 }}>
                      {timedOut ? "The clock ran out." : "Correct answer above."}
                    </div>
                  )}
                  {gotIt && !isEscape && gainInfo && (
                    <>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.star, marginTop: 4 }}>
                        +{gainInfo.base + gainInfo.bonus} pts
                      </div>
                      {gainInfo.bonus > 0 && (
                        <div
                          className="absolute inset-x-0 pointer-events-none"
                          style={{ top: 6, animation: "speedFloat 1.5s cubic-bezier(.2,.8,.2,1) both" }}
                        >
                          <span
                            className="px-2 py-1 rounded-md"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              color: C.ion,
                              background: `${C.ion}1A`,
                              border: `1px solid ${C.ion}66`,
                              textShadow: `0 0 12px ${C.ion}`,
                            }}
                          >
                            +{gainInfo.bonus} SPEED
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <Btn full onClick={advance} style={{ padding: "15px", fontSize: 15 }}>
                  {isEscape
                    ? dead
                      ? "See how far you got"
                      : "Keep climbing"
                    : pIndex === players.length - 1 && qIndex === totalRounds - 1
                    ? "See results"
                    : players.length > 1
                    ? "Next player"
                    : "Next question"}
                </Btn>
              </div>
            )}
          </div>
        </div>

        {paused && !answered && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-6" style={{ background: "#000000dd", backdropFilter: "blur(4px)" }}>
            <div className="text-center">
              <Pause size={44} style={{ color: C.ion, margin: "0 auto 16px" }} />
              <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 26, color: C.star }} className="mb-2">
                Paused
              </div>
              <div className="text-sm mb-6" style={{ color: C.dim }}>Timer's stopped. Nobody's cheating.</div>
              <Btn onClick={() => setPaused(false)}>Resume</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


/* ============================================================
   ROOT
   ============================================================ */
export default function OrbitTrivia() {
  const [themeId, setThemeId] = useState(null);
  const [booted, setBooted] = useState(false);
  const [screen, setScreen] = useState("home");
  const [pendingMode, setPendingMode] = useState(null);
  const [config, setConfig] = useState(null);
  const [mode, setMode] = useState("daily");
  const [results, setResults] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [stats, setStats] = useState({ best: 0, streak: 0, runs: 0 });
  const [dailyDone, setDailyDone] = useState(false);
  const [profile, setProfile] = useState({ name: "", handle: "", model: "" });
  const [dayStreakData, setDayStreakData] = useState({ lastDate: null, current: 0, best: 0 });
  const [streakMilestone, setStreakMilestone] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [escapeBest, setEscapeBest] = useState(0);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [androidEvt, setAndroidEvt] = useState(null);

  /* Android and desktop Chrome fire this when the site qualifies as
     installable. Holding onto it lets a real Install button work. */
  useEffect(() => {
    const grab = (e) => { e.preventDefault(); setAndroidEvt(e); };
    window.addEventListener("beforeinstallprompt", grab);
    const done = () => setAndroidEvt(null);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", grab);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  /* The hint waits until someone has finished a run. Asking a
     first-time visitor to install something they haven't played
     yet is how you get it dismissed forever. */
  const showInstall =
    !installDismissed && !isInstalled() && stats.runs >= 1 && (androidEvt !== null || isIOSSafari());

  const dismissInstall = async () => {
    setInstallDismissed(true);
    try { await storage.set("orbit:installhint", "off"); } catch (e) { /* session only */ }
  };

  const runAndroidInstall = androidEvt
    ? async () => {
        try {
          androidEvt.prompt();
          await androidEvt.userChoice;
        } catch (e) { /* dismissed */ }
        setAndroidEvt(null);
        dismissInstall();
      }
    : null;

  /* Browsers refuse to start audio until the player has touched the
     screen at least once. This listens for that first touch anywhere
     and opens the audio system inside it, so nothing is swallowed. */
  useEffect(() => {
    const open = () => SFX.unlock();
    window.addEventListener("pointerdown", open);
    window.addEventListener("touchstart", open);
    /* Coming back from the home screen, a phone call, or a locked
       screen leaves audio interrupted — try to bring it back rather
       than waiting for the player to notice it's gone. */
    const wake = () => { if (!document.hidden) SFX.revive(); };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("pageshow", wake);
    window.addEventListener("focus", wake);
    return () => {
      window.removeEventListener("pointerdown", open);
      window.removeEventListener("touchstart", open);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pageshow", wake);
      window.removeEventListener("focus", wake);
    };
  }, []);

  useEffect(() => { SFX.setEnabled(soundOn); }, [soundOn]);
  useEffect(() => { if (themeId) SFX.setTheme(themeId); }, [themeId]);

  useEffect(() => {
    (async () => {
      try {
        const s = await storage.get("orbit:sound");
        if (s?.value === "off") setSoundOn(false);
      } catch (e) { /* default is on */ }
      /* The saved theme is deliberately NOT restored here. Every fresh
         launch starts on the Moon/Mars picker, even for returning players. */
      try {
        const r = await storage.get("orbit:stats");
        if (r?.value) setStats(JSON.parse(r.value));
      } catch (e) { /* nothing saved yet */ }
      try {
        const d = await storage.get("orbit:daily");
        if (d?.value && JSON.parse(d.value).date === todayKey()) setDailyDone(true);
      } catch (e) { /* no daily record yet */ }
      try {
        const p = await storage.get("orbit:profile");
        if (p?.value) setProfile({ name: "", handle: "", model: "", ...JSON.parse(p.value) });
      } catch (e) { /* no profile yet */ }
      try {
        const ds = await storage.get("orbit:daystreak");
        if (ds?.value) setDayStreakData({ lastDate: null, current: 0, best: 0, ...JSON.parse(ds.value) });
      } catch (e) { /* no day streak yet */ }
      try {
        const m = await storage.get("orbit:milestone");
        if (m?.value) setStreakMilestone(parseInt(m.value, 10));
      } catch (e) { /* no pending milestone */ }
      try {
        const ev = await storage.get("orbit:escape");
        if (ev?.value) setEscapeBest(parseFloat(ev.value) || 0);
      } catch (e) { /* no escape run yet */ }
      try {
        const ih = await storage.get("orbit:installhint");
        if (ih?.value === "off") setInstallDismissed(true);
      } catch (e) { /* never dismissed */ }
      setBooted(true);
    })();
  }, []);

  const pickTheme = async (id) => {
    setThemeId(id);
    SFX.setTheme(id);
    try { await storage.set("orbit:theme", id); } catch (e) { /* not fatal */ }
  };

  const toggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    SFX.setEnabled(next);
    if (next) SFX.ui();  // confirm it came back on
    try { await storage.set("orbit:sound", next ? "on" : "off"); } catch (e) { /* session only */ }
  };

  const dismissMilestone = async () => {
    setStreakMilestone(null);
    try { await storage.set("orbit:milestone", ""); } catch (e) { /* not fatal */ }
  };

  const saveProfile = async (next) => {
    setProfile(next);
    try { await storage.set("orbit:profile", JSON.stringify(next)); } catch (e) { /* session only */ }
    setScreen("home");
  };

  const saveStats = async (next) => {
    setStats(next);
    try { await storage.set("orbit:stats", JSON.stringify(next)); } catch (e) { /* session only */ }
  };

  const afterDrivingCheck = () => {
    const who = (profile.name || "").trim() || "You";
    if (pendingMode === "daily") {
      setMode("daily");
      setConfig({ players: [who], timer: 20, sameQ: true, count: 10, pool: QUESTIONS, difficulty: "Mixed", cats: [] });
      setRunKey((k) => k + 1);
      setScreen("game");
    } else if (pendingMode === "escape") {
      const deck = buildEscapeDeck();
      setMode("escape");
      setConfig({ players: [who], timer: ESCAPE.timerStart, sameQ: true, count: deck.length, pool: deck, difficulty: "Ladder", cats: [] });
      setRunKey((k) => k + 1);
      setScreen("game");
    } else {
      setScreen("custom");
    }
  };

  /* A fresh Escape run needs a fresh ladder, so "Launch again"
     rebuilds the deck instead of replaying the same order. */
  const relaunchEscape = () => {
    const deck = buildEscapeDeck();
    setConfig((c) => ({ ...c, count: deck.length, pool: deck }));
    setRunKey((k) => k + 1);
    setScreen("game");
  };

  const finish = async (data) => {
    if (data.escape) {
      setResults({ ...data, prevBestV: escapeBest });
      setScreen("results");
      if (data.velocity > escapeBest) {
        setEscapeBest(data.velocity);
        try { await storage.set("orbit:escape", String(data.velocity)); } catch (e) { /* session only */ }
      }
      await saveStats({ ...stats, runs: stats.runs + 1 });
      return;
    }
    setResults({ ...data, prevBest: stats.best });
    setScreen("results");
    const topScore = Math.max(...data.scores);
    const topStreak = Math.max(...data.bestStreaks);
    await saveStats({
      best: Math.max(stats.best, topScore),
      streak: Math.max(stats.streak, topStreak),
      runs: stats.runs + 1,
    });
    if (mode === "daily") {
      setDailyDone(true);
      try { await storage.set("orbit:daily", JSON.stringify({ date: todayKey(), score: topScore })); } catch (e) { /* not fatal */ }
      const nextStreak = bumpDayStreak(dayStreakData);
      if (nextStreak !== dayStreakData) {
        setDayStreakData(nextStreak);
        try { await storage.set("orbit:daystreak", JSON.stringify(nextStreak)); } catch (e) { /* not fatal */ }
        if (nextStreak.current === 7 || nextStreak.current === 30 || nextStreak.current === 100) {
          setStreakMilestone(nextStreak.current);
          try { await storage.set("orbit:milestone", String(nextStreak.current)); } catch (e) { /* not fatal */ }
        }
      }
    }
  };

  /* Fonts are loaded as real <link> tags in app/layout.jsx, not via
     @import in this <style> block — see the comment there for why. */
  const fonts = (
    <style>{`
      * { -webkit-tap-highlight-color: transparent; }
      button:focus-visible, input:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
      /* real strikes flicker — bright, stutter, re-strike, fade */
      @keyframes strike {
        0%   { opacity: 0; }
        6%   { opacity: 1; }
        14%  { opacity: .25; }
        22%  { opacity: 1; }
        38%  { opacity: .5; }
        48%  { opacity: 1; }
        70%  { opacity: .7; }
        100% { opacity: 0; }
      }
      @keyframes flash {
        0%   { transform: scale(.3); opacity: 0; }
        12%  { transform: scale(1);  opacity: .95; }
        30%  { transform: scale(1.1); opacity: .4; }
        45%  { transform: scale(1.2); opacity: .7; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      @keyframes urgent {
        0%, 100% { opacity: 1; }
        50%      { opacity: .4; }
      }
      @keyframes countIn {
        0%   { transform: scale(1.9); opacity: 0; }
        40%  { transform: scale(1);   opacity: 1; }
        100% { transform: scale(1);   opacity: 1; }
      }
      @keyframes blaze {
        0%, 100% { transform: rotate(-45deg) scale(1); }
        50%      { transform: rotate(-45deg) scale(1.14); }
      }
      @keyframes flicker {
        from { transform: scaleY(1) translateY(0);      opacity: .7; }
        to   { transform: scaleY(1.3) translateY(2px);  opacity: 1; }
      }
      @keyframes liftoff {
        0%   { transform: translateY(0); }
        28%  { transform: translateY(0); }
        45%  { transform: translateY(-14vh); }
        100% { transform: translateY(-160vh); }
      }
      @keyframes padshake {
        0%, 100% { transform: translateX(0); }
        25%      { transform: translateX(-2px); }
        75%      { transform: translateX(2px); }
      }
      @keyframes plume {
        from { opacity: .85; transform: scaleY(1); }
        to   { opacity: 1;   transform: scaleY(1.18); }
      }
      @keyframes smokeout {
        0%   { transform: translateY(0) scale(.6);      opacity: 0; }
        18%  { opacity: .85; }
        100% { transform: translateY(-52px) scale(2.2); opacity: 0; }
      }
      @keyframes skyfall {
        0%   { transform: translateY(0);      opacity: 0; }
        15%  { opacity: .55; }
        100% { transform: translateY(130vh);  opacity: 0; }
      }
      @keyframes verdictIn {
        0%   { transform: scale(.7) translateY(12px); opacity: 0; }
        100% { transform: scale(1)  translateY(0);    opacity: 1; }
      }
      @keyframes screenshake {
        0%, 100% { transform: translateX(0); }
        20%      { transform: translateX(-5px); }
        40%      { transform: translateX(4px); }
        60%      { transform: translateX(-3px); }
        80%      { transform: translateX(2px); }
      }
      @keyframes promoPop {
        0%   { transform: scale(.6);  opacity: 0; }
        12%  { transform: scale(1.06); opacity: 1; }
        20%  { transform: scale(1); }
        78%  { opacity: 1; }
        100% { transform: scale(1);  opacity: 0; }
      }
      @keyframes countBeat {
        0%   { transform: scale(2.2); opacity: 0; }
        18%  { transform: scale(1);   opacity: 1; }
        75%  { transform: scale(1);   opacity: 1; }
        100% { transform: scale(.88); opacity: .35; }
      }
      /* brief visible window inside a long cycle = an occasional comet */
      @keyframes comet {
        0%   { transform: translate(0, 0) rotate(14deg);          opacity: 0; }
        1%   { opacity: 0; }
        3%   { opacity: .9; }
        7%   { opacity: .9; }
        9%   { transform: translate(150vw, 34vh) rotate(14deg);   opacity: 0; }
        100% { transform: translate(150vw, 34vh) rotate(14deg);   opacity: 0; }
      }
      @keyframes speedFloat {
        0%   { transform: translateY(14px) scale(.8); opacity: 0; }
        20%  { transform: translateY(0) scale(1.08);  opacity: 1; }
        32%  { transform: translateY(0) scale(1); }
        70%  { transform: translateY(-6px);          opacity: 1; }
        100% { transform: translateY(-26px);         opacity: 0; }
      }
      @keyframes edgepulse {
        0%   { opacity: 0; }
        30%  { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes drift {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50%      { transform: translateY(-3px) rotate(-5deg); }
      }
      @keyframes miniLaunch {
        0%   { transform: translateY(0); }
        14%  { transform: translateY(2px); }
        100% { transform: translateY(-105vh); }
      }
      @keyframes miniReturn {
        0%   { transform: translateY(-64px); opacity: 0; }
        60%  { transform: translateY(3px);   opacity: 1; }
        100% { transform: translateY(0);     opacity: 1; }
      }
      @keyframes shatter {
        0%   { transform: translate(0, 0) rotate(0deg); }
        18%  { transform: translate(calc(var(--sx) * .3), calc(var(--sy) * .3)) rotate(calc(var(--sr) * .5)); }
        60%  { transform: translate(var(--sx), var(--sy)) rotate(var(--sr)); }
        100% { transform: translate(var(--sx), var(--sy)) rotate(var(--sr)); }
      }
      @keyframes reassemble {
        0%   { transform: translate(var(--sx), var(--sy)) rotate(var(--sr)); filter: none; }
        70%  { transform: translate(0, 0) rotate(0deg); filter: brightness(1.7); }
        100% { transform: translate(0, 0) rotate(0deg); filter: none; }
      }
      @keyframes cardvanish { from { opacity: 1; } to { opacity: 0; } }
      @keyframes cardreturn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes chargeup {
        0%   { transform: scale(1); }
        35%  { transform: scale(1.035); }
        100% { transform: scale(1); }
      }
      /* ---- home launch sequence ----
         Spread is driven by --spread / --spread2 so the throw distance can be
         tuned from the LAUNCH block in JS without touching these rules. */
      /* a freshly broken edge glows, then cools while the piece drifts */
      @keyframes edgeCool {
        0%   { opacity: 0;   filter: brightness(2.4); }
        18%  { opacity: 1;   filter: brightness(2.4); }
        100% { opacity: .45; filter: brightness(1); }
      }
      /* ...and goes white-hot as the pieces meet, then fades out welded */
      @keyframes weldSeam {
        0%   { opacity: .45; filter: brightness(1); }
        70%  { opacity: .9;  filter: brightness(1.8); }
        84%  { opacity: 1;   filter: brightness(3.4) drop-shadow(0 0 7px #FFFFFF); }
        92%  { opacity: .8;  filter: brightness(2.2); }
        100% { opacity: 0;   filter: brightness(1); }
      }
      @keyframes padBloom {
        0%, 100% { transform: scaleX(1);    opacity: .8; }
        50%      { transform: scaleX(1.14); opacity: 1; }
      }
      @keyframes extremeShatter {
        0%   { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; filter: brightness(1.4); }
        16%  { transform: translate(calc(var(--sx) * .5), calc(var(--sy) * .5)) rotate(calc(var(--sr) * 1.1)) scale(1.02); opacity: 1; }
        65%  { transform: translate(calc(var(--sx) * var(--spread)), calc(var(--sy) * var(--spread))) rotate(calc(var(--sr) * 3.4)) scale(.93); opacity: .55; }
        100% { transform: translate(calc(var(--sx) * var(--spread)), calc(var(--sy) * var(--spread))) rotate(calc(var(--sr) * 4)) scale(.9); opacity: .3; filter: none; }
      }
      @keyframes zeroFloat {
        0%   { transform: translate(calc(var(--sx) * var(--spread)),  calc(var(--sy) * var(--spread)))  rotate(calc(var(--sr) * 4))   scale(.9);  opacity: .3; }
        50%  { transform: translate(calc(var(--sx) * var(--spread2)), calc(var(--sy) * var(--spread2))) rotate(calc(var(--sr) * 4.8)) scale(.88); opacity: .2; }
        100% { transform: translate(calc(var(--sx) * var(--spread)),  calc(var(--sy) * var(--spread)))  rotate(calc(var(--sr) * 4))   scale(.9);  opacity: .3; }
      }
      @keyframes hardSnap {
        0%   { transform: translate(calc(var(--sx) * var(--spread)), calc(var(--sy) * var(--spread))) rotate(calc(var(--sr) * 4)) scale(.9); opacity: .3; }
        35%  { opacity: 1; }
        80%  { transform: translate(0, 0) rotate(0deg) scale(1.02); opacity: 1; filter: brightness(1.5); }
        100% { transform: translate(0, 0) rotate(0deg) scale(1);    opacity: 1; filter: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        * { transition-duration: .01ms !important; animation-duration: .01ms !important; }
      }
    `}</style>
  );

  if (!booted) {
    return (
      <div style={{ background: "#03040A", minHeight: "100vh" }}>
        {fonts}
      </div>
    );
  }

  if (!themeId) {
    return (
      <>
        {fonts}
        <PlanetPicker onPick={pickTheme} />
      </>
    );
  }

  const theme = THEMES[themeId];

  return (
    <ThemeCtx.Provider value={theme}>
      {fonts}
      <div style={{ background: theme.void, minHeight: "100vh", transition: "background .4s ease" }}>
        {screen === "home" && (
          <Home
            onDaily={() => { setPendingMode("daily"); setScreen("driving"); }}
            onCustom={() => { setPendingMode("custom"); setScreen("driving"); }}
            onEscape={() => { setPendingMode("escape"); setScreen("driving"); }}
            escapeBest={escapeBest}
            stats={stats}
            dailyDone={dailyDone}
            themeName={theme.name}
            onSwapTheme={() => pickTheme(themeId === "moon" ? "mars" : "moon")}
            profile={profile}
            dayStreak={liveDayStreak(dayStreakData)}
            onOpenProfile={() => setScreen("profile")}
            streakMilestone={streakMilestone}
            onDismissMilestone={dismissMilestone}
            soundOn={soundOn}
            onToggleSound={toggleSound}
            showInstall={showInstall}
            onDismissInstall={dismissInstall}
            androidPrompt={runAndroidInstall}
          />
        )}

        {screen === "profile" && (
          <ProfileScreen profile={profile} onSave={saveProfile} onBack={() => setScreen("home")} />
        )}

        {screen === "driving" && (
          <>
            <Home
              onDaily={() => {}}
              onCustom={() => {}}
              onEscape={() => {}}
              escapeBest={escapeBest}
              stats={stats}
              dailyDone={dailyDone}
              themeName={theme.name}
              onSwapTheme={() => {}}
              profile={profile}
              dayStreak={liveDayStreak(dayStreakData)}
              onOpenProfile={() => {}}
              streakMilestone={null}
              onDismissMilestone={() => {}}
              soundOn={soundOn}
              onToggleSound={() => {}}
              showInstall={false}
              onDismissInstall={() => {}}
              androidPrompt={null}
            />
            <DrivingCheck onConfirm={afterDrivingCheck} onCancel={() => setScreen("home")} />
          </>
        )}

        {screen === "custom" && (
          <CustomSetup
            onBack={() => setScreen("home")}
            onStart={(cfg) => { setMode("custom"); setConfig(cfg); setRunKey((k) => k + 1); setScreen("game"); }}
          />
        )}

        {screen === "game" && config && (
          <Game key={runKey} config={config} mode={mode} onFinish={finish} onQuit={() => setScreen("home")} />
        )}

        {screen === "results" && results && (
          results.escape ? (
            <EscapeResults
              data={results}
              profile={profile}
              prevBest={results.prevBestV}
              onHome={() => setScreen("home")}
              onAgain={relaunchEscape}
            />
          ) : (
            <Results
              data={results}
              profile={profile}
              onHome={() => setScreen("home")}
              onAgain={() => { setRunKey((k) => k + 1); setScreen("game"); }}
            />
          )
        )}
      </div>
    </ThemeCtx.Provider>
  );
}
