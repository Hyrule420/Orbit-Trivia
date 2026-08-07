"use client";

import React, { useState, useRef, useCallback } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Check, MapPin } from "lucide-react";
import { useC } from "../../lib/theme";
import { useMotion } from "../../lib/motion";
import { TIER_META } from "../../lib/questions";
import { SFX } from "../../lib/sfx";
import { buzz } from "../../lib/util";
import { zoneQuestions } from "../../lib/corridors";
import { Btn, Panel, Kicker } from "./ui";

/* ============================================================
   PICKING A QUESTION AT A LANDMARK.

   Most places on a road have one question. The handful worth stopping
   at twice — the pads, the VAB, Kennedy itself — carry five, and this
   is how you choose between them: all of them on screen at once, laid
   out as a reel you turn, rather than a list you read.

   Two things it is deliberately NOT:

     - It is not a quiz round. Answering one question is enough to
       finish the zone and get back on the road; the other four are
       there to be taken if you want them, not homework. Somebody in a
       moving car should be able to take exactly one and leave.
     - It is not a timer. Same rule as everywhere else in this mode:
       nothing here counts down, and nothing is lost by turning the reel
       for a while and then going back to the map.

   Anything already answered stays visible and turns green rather than
   disappearing, so the reel does not shuffle under your thumb between
   visits and you can see what you got.
   ============================================================ */

/* How much of the neighbouring cards shows past the edge of the current
   one. Enough to read as a reel with more on it, not so much that the
   middle card stops being obviously the one in play.

   The maths below is fussier than it looks. A flex item sizing itself
   with a percentage resolves that against the row's CONTENT box, while
   a percentage inside translateX resolves against its BORDER box — so
   putting padding on the row makes the two disagree, and the card
   creeps further off-centre with every step. The row therefore carries
   no padding at all, and the left gutter comes from the transform. */
const PEEK = 22;
const GAP = 12;

export default function QuestionCarousel({ zone, answeredIdx = [], onPick, onBackToMap }) {
  const C = useC();
  const motion = useMotion();
  const questions = zoneQuestions(zone);
  const tier = TIER_META[zone.d] || TIER_META.Earthbound;
  const tierColor = C[tier.key];

  /* Open on the first one they have not taken yet, so coming back to a
     landmark does not dump them on a question they have already done. */
  const [idx, setIdx] = useState(() => {
    const next = questions.findIndex((_, i) => !answeredIdx.includes(i));
    return next === -1 ? 0 : next;
  });

  const wrapRef = useRef(null);
  const dragRef = useRef(null);

  const go = useCallback((next, viaDrag) => {
    const clamped = Math.max(0, Math.min(questions.length - 1, next));
    if (clamped === idx) return;
    SFX.swipe(clamped > idx);
    if (!viaDrag) buzz(12);
    setIdx(clamped);
  }, [idx, questions.length]);

  /* Dragging the reel. Pointer events cover touch and mouse in one path,
     and the threshold is deliberately generous — this is used one-handed
     in a car by somebody who is not looking closely. */
  const onPointerDown = (e) => {
    dragRef.current = { x: e.clientX, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || d.moved) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 42) {
      d.moved = true;
      go(idx + (dx < 0 ? 1 : -1), true);
    }
  };
  const onPointerUp = () => { dragRef.current = null; };

  const cardW = `calc(100% - ${PEEK * 2}px)`;
  /* Card i sits at PEEK from the left once the row has been shifted by
     i whole steps, where a step is one card plus one gap. */
  const shift = `calc(${PEEK}px - ${idx} * (100% - ${PEEK * 2}px + ${GAP}px))`;

  return (
    <div className="min-h-screen max-w-md mx-auto px-4 pt-5 pb-6 flex flex-col">
      <button onClick={onBackToMap} className="flex items-center gap-2 mb-5 active:scale-95" style={{ color: C.dim }}>
        <ArrowLeft size={17} />
        <Kicker>BACK TO THE MAP</Kicker>
      </button>

      <div className="flex items-center gap-2 mb-1">
        <MapPin size={15} style={{ color: tierColor }} />
        <Kicker color={tierColor}>{zone.d.toUpperCase()} · {tier.points} PTS EACH</Kicker>
      </div>
      <div
        className="mb-1"
        style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 21, color: C.star }}
      >
        {zone.place}
      </div>
      <p className="text-sm mb-4" style={{ color: C.dim, lineHeight: 1.5 }}>
        {questions.length} questions about this one. Take as many as you like — one is enough to move on.
      </p>

      {/* ---- the reel ----
           Takes whatever height is left between the heading and the
           buttons, so the question is the biggest thing on the screen
           rather than a small card floating in a lot of nothing. */}
      <div
        ref={wrapRef}
        className="relative overflow-hidden flex-1 min-h-0"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* absolute inset-0 rather than h-full: it gives the row a
            definite box to size against, so the cards fill the reel
            instead of collapsing to their text height */}
        <div
          className="absolute inset-0 flex items-stretch"
          style={{
            gap: GAP,
            transform: `translateX(${shift})`,
            transition: motion.off ? "none" : "transform .42s cubic-bezier(.2,.8,.2,1)",
          }}
        >
          {questions.map((entry, i) => {
            const done = answeredIdx.includes(i);
            const active = i === idx;
            return (
              <div key={entry.q} className="h-full" style={{ width: cardW, flexShrink: 0 }}>
                <Panel
                  className="p-6 h-full flex flex-col"
                  style={{
                    borderColor: done ? `${C.thrust}66` : active ? `${tierColor}77` : C.edge,
                    /* the off-centre cards sit back rather than vanish, so
                       the reel reads as having depth */
                    transform: active ? "scale(1)" : "scale(.94)",
                    opacity: active ? 1 : 0.45,
                    transition: motion.off ? "none" : "transform .42s cubic-bezier(.2,.8,.2,1), opacity .42s ease, border-color .3s ease",
                    boxShadow: active && !done ? `0 0 40px ${tierColor}22` : "none",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Kicker color={done ? C.thrust : C.dim}>
                      {done ? "ANSWERED" : `QUESTION ${i + 1} OF ${questions.length}`}
                    </Kicker>
                    {done && <Check size={15} style={{ color: C.thrust }} />}
                  </div>
                  {/* centred in the card so a short question does not sit
                      marooned at the top of a tall panel */}
                  <div className="flex-1 flex items-center">
                    <p
                      style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: 21,
                        lineHeight: 1.45,
                        color: done ? C.dim : C.star,
                      }}
                    >
                      {entry.q}
                    </p>
                  </div>
                </Panel>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- which one you are on ---- */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={() => go(idx - 1)}
          disabled={idx === 0}
          aria-label="Previous question"
          className="flex items-center justify-center rounded-full active:scale-90"
          style={{
            width: 34, height: 34,
            background: C.hullLight,
            border: `1px solid ${C.edge}`,
            opacity: idx === 0 ? 0.35 : 1,
            transition: "transform .12s, opacity .2s",
          }}
        >
          <ChevronLeft size={16} style={{ color: C.dim }} />
        </button>

        <div className="flex items-center gap-1.5">
          {questions.map((entry, i) => {
            const done = answeredIdx.includes(i);
            return (
              <button
                key={entry.q}
                onClick={() => go(i)}
                aria-label={`Question ${i + 1}${done ? ", answered" : ""}`}
                style={{
                  width: i === idx ? 20 : 7,
                  height: 7,
                  borderRadius: 4,
                  background: done ? C.thrust : i === idx ? tierColor : C.edge,
                  transition: motion.off ? "none" : "width .3s cubic-bezier(.2,.8,.2,1), background .3s ease",
                }}
              />
            );
          })}
        </div>

        <button
          onClick={() => go(idx + 1)}
          disabled={idx === questions.length - 1}
          aria-label="Next question"
          className="flex items-center justify-center rounded-full active:scale-90"
          style={{
            width: 34, height: 34,
            background: C.hullLight,
            border: `1px solid ${C.edge}`,
            opacity: idx === questions.length - 1 ? 0.35 : 1,
            transition: "transform .12s, opacity .2s",
          }}
        >
          <ChevronRight size={16} style={{ color: C.dim }} />
        </button>
      </div>

      <div className="flex flex-col gap-2 mt-6">
        <Btn full onClick={() => onPick(idx)} disabled={answeredIdx.includes(idx)}>
          {answeredIdx.includes(idx) ? "Already answered" : "Answer this one"}
        </Btn>
        <Btn full variant="ghost" onClick={onBackToMap}>
          {answeredIdx.length ? "Done here" : "Back to the map"}
        </Btn>
      </div>
    </div>
  );
}
