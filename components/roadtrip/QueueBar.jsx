"use client";

import React, { useEffect, useRef } from "react";
import { MapPin, ChevronRight, Navigation, Check, ArrowLeft } from "lucide-react";
import { useC } from "../../lib/theme";
import { TIER_META } from "../../lib/questions";
import { Btn, Panel, Kicker, formatDistance } from "./ui";

/* This file deliberately imports no corridor data. The `byId` lookup
   comes in as a prop, so the queue works for whichever road is being
   driven without knowing anything about corridors at all. */

/* ============================================================
   The bar pinned to the bottom of the screen.

   Two jobs, depending on what is going on:

     * Questions waiting  -> "2 waiting · Weeki Wachee"  (tap to play)
     * Nothing waiting    -> "Next up · Homosassa · 4.2 mi"

   That second state matters more than it looks. Without it the mode
   feels dead for the ten minutes between landmarks; with it there is
   always something ticking down.
   ============================================================ */

export function QueueBar({ queue, nearest, onOpen, byId }) {
  const C = useC();
  const waiting = queue.length;
  const latest = waiting ? byId[queue[queue.length - 1]] : null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-3"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <button
        onClick={waiting ? onOpen : undefined}
        className={`w-full max-w-md rounded-2xl px-4 py-3 text-left ${waiting ? "active:scale-95" : ""}`}
        style={{
          background: waiting ? C.hull : `${C.hull}E6`,
          border: `1px solid ${waiting ? `${C.ion}77` : C.edge}`,
          boxShadow: waiting ? `0 0 28px ${C.ion}26` : "none",
          cursor: waiting ? "pointer" : "default",
          transition: "border-color .25s ease, box-shadow .25s ease",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 34, height: 34, flexShrink: 0,
              background: waiting ? `${C.ion}1F` : `${C.edge}55`,
              border: `1px solid ${waiting ? `${C.ion}66` : C.edge}`,
            }}
          >
            {waiting
              ? <MapPin size={16} style={{ color: C.ion }} />
              : <Navigation size={15} style={{ color: C.dim }} />}
          </div>

          <div className="flex-1 min-w-0">
            {waiting ? (
              <>
                <Kicker color={C.ion}>{waiting} {waiting === 1 ? "QUESTION" : "QUESTIONS"} WAITING</Kicker>
                <div className="truncate" style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, fontSize: 15, color: C.star }}>
                  {latest?.place}
                </div>
              </>
            ) : (
              <>
                <Kicker>NEXT UP</Kicker>
                <div className="truncate" style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, fontSize: 15, color: C.dim }}>
                  {nearest
                    ? `${nearest.zone.place} · ${formatDistance(nearest.distanceM)}`
                    : "Waiting for a position fix"}
                </div>
              </>
            )}
          </div>

          {waiting > 0 && <ChevronRight size={20} style={{ color: C.ion, flexShrink: 0 }} />}
        </div>
      </button>
    </div>
  );
}

/* ============================================================
   A small toast, used instead of the big arrival pop-up when zones are
   coming thick and fast. Three landmarks in a minute would make the
   full-size pop-up feel like nagging, and in a car that matters.
   ============================================================ */
export function ArrivalToast({ zone, onDone }) {
  const timerRef = useRef(null);
  const C = useC();

  useEffect(() => {
    timerRef.current = setTimeout(onDone, 3500);
    return () => clearTimeout(timerRef.current);
  }, [zone.id, onDone]);

  return (
    <>
      <style>{`
        @keyframes nc-toast {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) { .nc-toast { animation: none !important; } }
      `}</style>
      <div className="fixed inset-x-0 z-40 flex justify-center px-4" style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}>
        <div
          className="nc-toast w-full max-w-md rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            background: C.hullLight,
            border: `1px solid ${C.ion}55`,
            boxShadow: `0 0 24px ${C.void}`,
            animation: "nc-toast .3s ease both",
          }}
        >
          <MapPin size={15} style={{ color: C.ion, flexShrink: 0 }} />
          <span className="truncate text-sm" style={{ color: C.star }}>
            <strong style={{ fontWeight: 600 }}>{zone.place}</strong>
            <span style={{ color: C.dim }}> — added to your queue</span>
          </span>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   The full queue, opened from the bar.
   ============================================================ */
export function QueueList({ queue, answered, onPlay, onSkip, onBack, byId }) {
  const C = useC();

  return (
    <div className="min-h-screen max-w-md mx-auto px-4 pt-5 pb-8">
      <button onClick={onBack} className="flex items-center gap-2 mb-5 active:scale-95" style={{ color: C.dim }}>
        <ArrowLeft size={17} />
        <Kicker>BACK TO THE MAP</Kicker>
      </button>

      <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 24, color: C.star }}>
        Your queue
      </div>
      <p className="text-sm mt-1 mb-5" style={{ color: C.dim }}>
        {queue.length
          ? "Places you've driven past. Answer them whenever you like — nothing expires."
          : "Nothing waiting. Keep driving and questions will collect here."}
      </p>

      <div className="flex flex-col gap-2">
        {queue.map((id) => {
          const zone = byId[id];
          if (!zone) return null;
          const tier = TIER_META[zone.d] || TIER_META.Earthbound;
          return (
            <Panel key={id} className="p-4" style={{ borderColor: `${C[tier.key]}44` }}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <Kicker color={C[tier.key]}>{zone.d.toUpperCase()} · {tier.points} PTS</Kicker>
                  <div className="truncate" style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, fontSize: 16, color: C.star }}>
                    {zone.place}
                  </div>
                </div>
                <Btn onClick={() => onPlay(id)} style={{ padding: "8px 14px", flexShrink: 0 }}>Play</Btn>
              </div>
              <button
                onClick={() => onSkip(id)}
                className="mt-3 active:scale-95"
                style={{ color: C.dim, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}
              >
                SKIP THIS ONE
              </button>
            </Panel>
          );
        })}
      </div>

      {Object.keys(answered).length > 0 && (
        <>
          <div className="mt-8 mb-3">
            <Kicker>ALREADY ANSWERED</Kicker>
          </div>
          <div className="flex flex-col gap-1">
            {Object.entries(answered).map(([id, res]) => {
              const zone = byId[id];
              if (!zone) return null;
              return (
                <div key={id} className="flex items-center gap-2 py-2 px-1">
                  {res.correct
                    ? <Check size={15} style={{ color: C.thrust, flexShrink: 0 }} />
                    : <span style={{ width: 15, flexShrink: 0 }} />}
                  <span className="truncate text-sm flex-1" style={{ color: C.dim }}>{zone.place}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: res.correct ? C.thrust : C.dim }}>
                    {res.correct ? `+${res.points}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
