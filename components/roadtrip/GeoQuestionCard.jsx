"use client";

import React, { useState, useMemo } from "react";
import { MapPin, Check, X, ChevronRight, Map } from "lucide-react";
import { useC } from "../../lib/theme";
import { TIER_META } from "../../lib/questions";
import { shuffle, buzz } from "../../lib/util";
import { zoneQuestions } from "../../lib/corridors";
import { Btn, Panel, Kicker } from "./ui";

/* ============================================================
   Plays one road trip question.

   This is deliberately NOT the main Game component. Game is built
   around a countdown — the timer drives its scoring, its progress bar
   and its whole phase machine — and it also handles pass-and-play with
   several players and a fixed deck decided up front. None of that is
   true here: there is no timer at all, there is one player, and the
   queue grows while you are playing it.

   Scoring is therefore the flat tier value with no speed bonus, since
   there is no clock to be fast against.

   The reward for a correct answer is the `blurb` — the actual fact
   about the place you are driving past. That is the payload of the
   whole mode, so it shows either way, right or wrong.
   ============================================================ */

export default function GeoQuestionCard({ zone, question, queueRemaining, onAnswered, onNext, onBackToMap }) {
  const C = useC();
  const [picked, setPicked] = useState(null);
  const tier = TIER_META[zone.d] || TIER_META.Earthbound;
  const tierColor = C[tier.key];

  /* Which question of this zone we are asking. Landmarks carry several
     and the carousel picks one; everywhere else there is exactly one and
     zoneQuestions() hands back the inline q/o/a unchanged. */
  const Q = question || zoneQuestions(zone)[0] || { q: "", o: [], a: "" };

  /* Shuffle the four options, but seed it from the zone id and the
     question text so the order is stable if the component re-renders
     mid-question — and so two questions on the same zone do not get
     the same shuffle applied to them. */
  const options = useMemo(() => {
    const seed = (zone.id + Q.q).split("").reduce((n, ch) => n + ch.charCodeAt(0), 0);
    return shuffle(Q.o, seed);
  }, [zone.id, Q.q, Q.o]);

  const revealed = picked !== null;
  const isRight = picked === Q.a;

  const choose = (choice) => {
    if (revealed) return;
    setPicked(choice);
    const correct = choice === Q.a;
    buzz(correct ? 18 : [30, 60, 30]);
    onAnswered(zone.id, correct, correct ? tier.points : 0);
  };

  const optionStyle = (opt) => {
    if (!revealed) {
      return { background: C.hullLight, border: `1px solid ${C.edge}`, color: C.star };
    }
    if (opt === Q.a) {
      return { background: `${C.thrust}1A`, border: `1px solid ${C.thrust}`, color: C.star };
    }
    if (opt === picked) {
      return { background: `${C.abort}1A`, border: `1px solid ${C.abort}`, color: C.star };
    }
    return { background: C.hullLight, border: `1px solid ${C.edge}`, color: C.dim, opacity: 0.55 };
  };

  return (
    <div className="min-h-screen max-w-md mx-auto px-4 pt-5 pb-8">
      <style>{`
        /* The chosen answer swelling as it lands. */
        @keyframes gq-hit {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.035); }
          100% { transform: scale(1); }
        }
        /* A ring of colour radiating out of it. */
        @keyframes gq-burst {
          0%   { transform: scale(.6); opacity: .8; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        /* Sparks thrown up and fading. */
        @keyframes gq-spark {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-46px) scale(.3); opacity: 0; }
        }
        /* Wrong: a short shake, over quickly. Not a punishment. */
        @keyframes gq-wrong {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          45%     { transform: translateX(5px); }
          70%     { transform: translateX(-3px); }
        }
        /* The payoff panel easing up rather than snapping in. */
        @keyframes gq-reveal {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          html:not([data-motion=full]):not([data-motion=subtle]) .gq-anim { animation: none !important; }
        }
        html[data-motion=off] .gq-anim { animation: none !important; }
      `}</style>
      {/* Where you are */}
      <div className="flex items-center gap-2 mb-1">
        <MapPin size={15} style={{ color: tierColor }} />
        <Kicker color={tierColor}>{zone.d.toUpperCase()} · {tier.points} PTS</Kicker>
      </div>
      <div
        className="mb-5"
        style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 21, color: C.star }}
      >
        {zone.place}
      </div>

      {/* The question */}
      <Panel className="p-5 mb-4" style={{ borderColor: `${tierColor}44` }}>
        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 17, lineHeight: 1.5, color: C.star }}>
          {Q.q}
        </p>
      </Panel>

      {/* The four answers */}
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const isChosen = opt === picked;
          const rightOne = revealed && opt === Q.a;
          /* Celebrate on the option you actually tapped: swell on a hit,
             a quick shake on a miss. Everything else stays still. */
          const feedback = !revealed
            ? undefined
            : isChosen && isRight
              ? "gq-hit .45s ease-out both"
              : isChosen && !isRight
                ? "gq-wrong .4s ease-out both"
                : undefined;
          return (
            <div key={opt} className="relative">
              {/* the ring, thrown out from the right answer */}
              {rightOne && (
                <div
                  className="gq-anim absolute inset-0 rounded-xl pointer-events-none"
                  style={{ border: `2px solid ${C.thrust}`, animation: "gq-burst .7s ease-out both" }}
                />
              )}
              {/* sparks, only when you got it right */}
              {rightOne && isRight && (
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  {[18, 38, 58, 78].map((pct, i) => (
                    <span
                      key={pct}
                      className="gq-anim absolute rounded-full"
                      style={{
                        left: `${pct}%`, top: "50%", width: 4, height: 4,
                        background: i % 2 ? tierColor : C.thrust,
                        animation: `gq-spark ${0.6 + i * 0.08}s ease-out ${i * 0.04}s both`,
                      }}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={() => choose(opt)}
                disabled={revealed}
                className="gq-anim w-full text-left px-4 py-3 rounded-xl active:scale-95"
                style={{
                  ...optionStyle(opt),
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 15,
                  lineHeight: 1.4,
                  transition: "background .2s ease, border-color .2s ease, opacity .2s ease",
                  cursor: revealed ? "default" : "pointer",
                  animation: feedback,
                  boxShadow: rightOne ? `0 0 26px ${C.thrust}44` : undefined,
                }}
              >
                <span className="flex items-center justify-between gap-3">
                  <span>{opt}</span>
                  {rightOne && <Check size={17} style={{ color: C.thrust, flexShrink: 0 }} />}
                  {revealed && isChosen && !rightOne && <X size={17} style={{ color: C.abort, flexShrink: 0 }} />}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* The payoff: the real story about this place */}
      {revealed && (
        <>
          <Panel
            className="gq-anim p-5 mt-5"
            style={{
              borderColor: isRight ? `${C.thrust}55` : `${C.edge}`,
              background: isRight ? `${C.thrust}0D` : C.hull,
              animation: "gq-reveal .4s cubic-bezier(.16,1,.3,1) .12s both",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Kicker color={isRight ? C.thrust : C.dim}>
                {isRight ? `CORRECT · +${tier.points}` : "NOT THIS TIME"}
              </Kicker>
            </div>
            <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 15, lineHeight: 1.6, color: C.dim }}>
              {zone.blurb}
            </p>
          </Panel>

          <div className="flex flex-col gap-2 mt-5">
            {queueRemaining > 0 ? (
              <Btn full onClick={onNext}>
                <span className="inline-flex items-center justify-center gap-2">
                  Next question ({queueRemaining}) <ChevronRight size={16} />
                </span>
              </Btn>
            ) : null}
            <Btn full variant="ghost" onClick={onBackToMap}>
              <span className="inline-flex items-center justify-center gap-2">
                <Map size={15} /> Back to the map
              </span>
            </Btn>
          </div>
        </>
      )}

      {!revealed && (
        <div className="text-center mt-5">
          <Kicker>NO TIMER — ANSWER WHEN YOU&apos;RE READY</Kicker>
        </div>
      )}
    </div>
  );
}
