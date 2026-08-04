"use client";

import React, { useEffect, useRef } from "react";
import { MapPin, ChevronRight, Clock } from "lucide-react";
import { useC } from "../../lib/theme";
import { TIER_META } from "../../lib/questions";
import { Btn, Kicker } from "./ui";

/* ============================================================
   THE ARRIVAL POP-UP — the big moment of this mode.

   You just drove into somewhere interesting, and this is the game
   making a fuss about it: glow, pulse, a bolt of light, a buzz.

   Three rules it must always obey, because people are in a moving car:

     1. It never opens a question by itself. Ever.
     2. There is no answer timer anywhere near it.
     3. Ignoring it completely is a valid, lossless choice — after a few
        seconds it tucks the question into the queue and gets out of the
        way.

   The draining hairline at the bottom shows that self-dismissal coming.
   It is deliberately a thin line rather than a countdown ring, because
   a ring reads as "hurry up" and that is the opposite of the point.
   ============================================================ */

const AUTO_QUEUE_MS = 8000;

export default function ArrivalPopup({ zone, queueCount, onPlayNow, onSaveForLater }) {
  const C = useC();
  const timerRef = useRef(null);
  const tier = TIER_META[zone.d] || TIER_META.Earthbound;
  const tierColor = C[tier.key];

  /* Left alone, it files itself in the queue. Nothing is lost. */
  useEffect(() => {
    timerRef.current = setTimeout(() => onSaveForLater(zone.id), AUTO_QUEUE_MS);
    return () => clearTimeout(timerRef.current);
  }, [zone.id, onSaveForLater]);

  return (
    <>
      <style>{`
        @keyframes nc-rise {
          from { transform: translateY(110%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes nc-halo {
          0%,100% { transform: scale(1);    opacity: .55; }
          50%     { transform: scale(1.35); opacity: 0; }
        }
        @keyframes nc-sheen {
          from { transform: translateX(-120%); }
          to   { transform: translateX(220%); }
        }
        @keyframes nc-drain { from { width: 100%; } to { width: 0%; } }
        @keyframes nc-pin {
          0%,100% { transform: translateY(0); }
          40%     { transform: translateY(-4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nc-anim { animation: none !important; }
        }
      `}</style>

      {/* A gradient rather than a black sheet: the map stays readable
          above it, so the passenger keeps their sense of where you are. */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 pointer-events-none"
        style={{ height: "62vh", background: `linear-gradient(to top, ${C.void}F2 38%, ${C.void}00)` }}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
        <div
          className="nc-anim w-full max-w-md rounded-3xl overflow-hidden relative"
          style={{
            background: C.hull,
            border: `1px solid ${tierColor}66`,
            boxShadow: `0 0 60px ${tierColor}33, 0 -8px 40px ${C.void}`,
            animation: "nc-rise .42s cubic-bezier(.16,1,.3,1) both",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* A light sweeping across the card once as it lands. */}
          <div
            className="nc-anim absolute inset-y-0 pointer-events-none"
            style={{
              width: "45%",
              background: `linear-gradient(100deg, transparent, ${tierColor}22, transparent)`,
              animation: "nc-sheen 1.1s ease-out .2s both",
            }}
          />

          <div className="p-5 relative">
            <div className="flex items-start gap-4">
              {/* Pulsing pin with an expanding halo behind it. */}
              <div className="relative flex items-center justify-center" style={{ width: 56, height: 56, flexShrink: 0 }}>
                <div
                  className="nc-anim absolute rounded-full"
                  style={{
                    inset: 0,
                    border: `2px solid ${tierColor}`,
                    animation: "nc-halo 1.8s ease-out infinite",
                  }}
                />
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 56, height: 56, background: `${tierColor}1F`, border: `1px solid ${tierColor}77` }}
                >
                  <MapPin size={26} style={{ color: tierColor, animation: "nc-pin 1.8s ease-in-out infinite" }} className="nc-anim" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Kicker color={tierColor}>YOU&apos;VE ARRIVED</Kicker>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      letterSpacing: "0.14em",
                      color: C.dim,
                    }}
                  >
                    +{tier.points} PTS
                  </span>
                </div>

                <div
                  style={{
                    fontFamily: "'Chakra Petch', sans-serif",
                    fontWeight: 700,
                    fontSize: 23,
                    lineHeight: 1.15,
                    color: C.star,
                  }}
                >
                  {zone.place}
                </div>

                <p
                  className="text-sm mt-2"
                  style={{
                    color: C.dim,
                    lineHeight: 1.55,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {zone.blurb}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <Btn full onClick={() => onPlayNow(zone.id)}>
                <span className="inline-flex items-center justify-center gap-2">
                  Play it now <ChevronRight size={16} />
                </span>
              </Btn>
              <Btn variant="ghost" onClick={() => onSaveForLater(zone.id)} style={{ flexShrink: 0 }}>
                <span className="inline-flex items-center gap-2">
                  <Clock size={15} /> Later
                </span>
              </Btn>
            </div>

            {queueCount > 0 && (
              <div className="text-center mt-3">
                <Kicker>{queueCount} ALREADY WAITING</Kicker>
              </div>
            )}
          </div>

          {/* The self-dismiss hairline. Not a countdown — nothing is lost
              when it runs out, the question just goes to the queue. */}
          <div style={{ height: 2, background: `${C.edge}` }}>
            <div
              className="nc-anim"
              style={{
                height: "100%",
                background: tierColor,
                animation: `nc-drain ${AUTO_QUEUE_MS}ms linear both`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
