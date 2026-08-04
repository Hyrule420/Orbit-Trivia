"use client";

import React, { useState, useMemo } from "react";
import { MapPin, Check, X, ChevronRight, Map } from "lucide-react";
import { useC } from "../../lib/theme";
import { TIER_META } from "../../lib/questions";
import { shuffle, buzz } from "../../lib/util";
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

export default function GeoQuestionCard({ zone, queueRemaining, onAnswered, onNext, onBackToMap }) {
  const C = useC();
  const [picked, setPicked] = useState(null);
  const tier = TIER_META[zone.d] || TIER_META.Earthbound;
  const tierColor = C[tier.key];

  /* Shuffle the four options, but seed it from the zone id so the order
     is stable if the component re-renders mid-question. */
  const options = useMemo(() => {
    const seed = zone.id.split("").reduce((n, ch) => n + ch.charCodeAt(0), 0);
    return shuffle(zone.o, seed);
  }, [zone.id, zone.o]);

  const revealed = picked !== null;
  const isRight = picked === zone.a;

  const choose = (choice) => {
    if (revealed) return;
    setPicked(choice);
    const correct = choice === zone.a;
    buzz(correct ? 18 : [30, 60, 30]);
    onAnswered(zone.id, correct, correct ? tier.points : 0);
  };

  const optionStyle = (opt) => {
    if (!revealed) {
      return { background: C.hullLight, border: `1px solid ${C.edge}`, color: C.star };
    }
    if (opt === zone.a) {
      return { background: `${C.thrust}1A`, border: `1px solid ${C.thrust}`, color: C.star };
    }
    if (opt === picked) {
      return { background: `${C.abort}1A`, border: `1px solid ${C.abort}`, color: C.star };
    }
    return { background: C.hullLight, border: `1px solid ${C.edge}`, color: C.dim, opacity: 0.55 };
  };

  return (
    <div className="min-h-screen max-w-md mx-auto px-4 pt-5 pb-8">
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
          {zone.q}
        </p>
      </Panel>

      {/* The four answers */}
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => choose(opt)}
            disabled={revealed}
            className="w-full text-left px-4 py-3 rounded-xl active:scale-95"
            style={{
              ...optionStyle(opt),
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 15,
              lineHeight: 1.4,
              transition: "background .2s ease, border-color .2s ease, opacity .2s ease",
              cursor: revealed ? "default" : "pointer",
            }}
          >
            <span className="flex items-center justify-between gap-3">
              <span>{opt}</span>
              {revealed && opt === zone.a && <Check size={17} style={{ color: C.thrust, flexShrink: 0 }} />}
              {revealed && opt === picked && opt !== zone.a && <X size={17} style={{ color: C.abort, flexShrink: 0 }} />}
            </span>
          </button>
        ))}
      </div>

      {/* The payoff: the real story about this place */}
      {revealed && (
        <>
          <Panel
            className="p-5 mt-5"
            style={{
              borderColor: isRight ? `${C.thrust}55` : `${C.edge}`,
              background: isRight ? `${C.thrust}0D` : C.hull,
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
