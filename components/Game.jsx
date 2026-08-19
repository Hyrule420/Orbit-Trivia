"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Pause, Check, Lightbulb } from "lucide-react";
import { useC } from "@/lib/theme";
import { TIER_META } from "@/lib/questions";
import { shuffle, buzz } from "@/lib/util";
import { todaySeed } from "@/lib/day";
import { buildDailyDeck } from "@/lib/daily";
import { ESCAPE, escapeTimer } from "@/lib/escape";
import { SFX } from "@/lib/sfx";
import Starfield from "@/components/art/Starfield";
import TrajectoryRail from "@/components/art/TrajectoryRail";
import Lightning from "@/components/art/Lightning";
import LaunchCelebration from "@/components/art/LaunchCelebration";
import Btn from "@/components/ui/Btn";
import Handoff from "@/components/ui/Handoff";
import CountdownLaunch from "@/components/screens/CountdownLaunch";

export default function Game({ config, mode, onFinish, onQuit }) {
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
    } else if (mode === "daily") {
      /* Same ten for everyone today, but 3 Earthbound → 4 Orbit → 3 Martian. */
      const shared = buildDailyDeck(config.pool, todaySeed());
      deckRef.current = players.map(() => shared);
    } else if (sameQ || players.length === 1) {
      const shared = shuffle(config.pool).slice(0, totalRounds);
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
                {question.insight && (
                  <div
                    className="p-4 rounded-xl mb-3"
                    style={{
                      background: C.hullLight,
                      border: `1px solid ${C.edge}`,
                      animation: "verdictIn .5s cubic-bezier(.2,.8,.2,1) .15s both",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative flex items-center justify-center" style={{ width: 18, height: 18 }}>
                        {/* the panel lands first; this fires a beat later so the
                            bulb visibly switches on rather than just being there.
                            edgepulse is a single smooth rise-and-fall (unlike flash's
                            multi-flicker curve, built for a lightning strike) so this
                            reads as a glow holding and fading, not a spark. */}
                        <div
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            width: 52, height: 52,
                            background: `radial-gradient(circle, ${C.ion}FF 0%, ${C.ion}99 35%, transparent 72%)`,
                            animation: "edgepulse 1.3s ease-out .45s both",
                          }}
                        />
                        <Lightbulb size={18} style={{ color: C.ion, position: "relative", animation: "chargeup .7s ease-out .45s both" }} />
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.ion, letterSpacing: "0.14em" }}>
                        WHY IT MATTERS
                      </span>
                    </div>
                    <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 14, lineHeight: 1.6, color: C.dim }}>
                      {question.insight}
                    </p>
                  </div>
                )}
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
