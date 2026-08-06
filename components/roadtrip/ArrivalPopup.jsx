"use client";

import React, { useEffect, useRef } from "react";
import { MapPin, ChevronRight, Clock } from "lucide-react";
import { useC } from "../../lib/theme";
import { TIER_META } from "../../lib/questions";
import { heavyDay } from "../../lib/day";
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

export default function ArrivalPopup({ zone, queueCount, onPlayNow, onSaveForLater, bigFx = false }) {
  const C = useC();
  const timerRef = useRef(null);
  const tier = TIER_META[zone.d] || TIER_META.Earthbound;
  const tierColor = C[tier.key];

  /* `kind` lets a zone say what sort of place it is, so arriving at a
     launch pad feels different from arriving at a fishing village.
     Anything without one gets the plain entrance. */
  const isPad = zone.kind === "pad";
  /* Two boosters coming home instead of one — see heavyDay() in lib/day.js. */
  const isHeavy = zone.fx === "landing" && heavyDay();
  const entrance = isPad
    ? "nc-rise .42s cubic-bezier(.16,1,.3,1) both, nc-glow 1.4s ease-out both"
    : zone.kind === "wildlife"
      ? "nc-drift .6s cubic-bezier(.16,1,.3,1) both"
      : "nc-rise .42s cubic-bezier(.16,1,.3,1) both";

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

        /* ---- launch pads ---- */
        /* The ignition flash: a hard bloom under the card that fades. */
        @keyframes nc-ignite {
          0%   { opacity: 0; transform: scaleX(.3); }
          12%  { opacity: 1; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(1.4); }
        }
        /* The rocket climbing out of frame behind the card. */
        @keyframes nc-lift {
          0%   { transform: translateY(18px) scale(.9); opacity: 0; }
          18%  { transform: translateY(10px) scale(1);  opacity: 1; }
          100% { transform: translateY(-190px) scale(.7); opacity: 0; }
        }
        /* Exhaust trailing under it, stretching as it goes. */
        @keyframes nc-plume {
          0%   { transform: scaleY(0) translateY(0); opacity: 0; }
          20%  { transform: scaleY(1) translateY(0); opacity: .85; }
          100% { transform: scaleY(2.6) translateY(-120px); opacity: 0; }
        }
        /* The glow on the card ramping up on ignition, then settling. */
        @keyframes nc-glow {
          0%   { box-shadow: 0 0 0 rgba(0,0,0,0); }
          25%  { box-shadow: var(--nc-glow-peak); }
          100% { box-shadow: var(--nc-glow-rest); }
        }

        /* ---- water ---- */
        @keyframes nc-ripple {
          0%   { transform: scale(.4); opacity: .7; }
          100% { transform: scale(2.6); opacity: 0; }
        }

        /* ---- wildlife ---- */
        @keyframes nc-drift {
          from { transform: translateY(110%) translateX(-8px); opacity: 0; }
          to   { transform: translateY(0) translateX(0);       opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          html:not([data-motion=full]):not([data-motion=subtle]) .nc-anim { animation: none !important; }
        }
        html[data-motion=off] .nc-anim { animation: none !important; }
      `}</style>

      {/* A gradient rather than a black sheet: the map stays readable
          above it, so the passenger keeps their sense of where you are. */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 pointer-events-none"
        style={{ height: "62vh", background: `linear-gradient(to top, ${C.void}F2 38%, ${C.void}00)` }}
      />

      {/* A rocket climbing out behind the card, for launch complexes.
          It sits below the card in z-order so it reads as happening out
          there rather than on top of the interface. */}
      {/* Offset high enough to clear the card, so the rocket climbs up
          across the map rather than being hidden behind the interface. */}
      {/* Stood down when the full-screen sequence is flying its own,
          much larger vehicle over the top of this one (see
          components/roadtrip/PadLaunchFX.jsx). Two rockets at two
          different scales in the same frame reads as a rendering fault,
          not as depth. The VAB and the Crawlerway have no sequence, so
          they keep this one — as does every pad when the player has
          motion turned down to Subtle. */}
      {isPad && !bigFx && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center pointer-events-none" style={{ paddingBottom: 310 }}>
          <div className="relative" style={{ width: 40, height: 120 }}>
            <div
              className="nc-anim absolute left-1/2"
              style={{
                bottom: 0, width: 10, marginLeft: -5, height: 60,
                transformOrigin: "top center",
                background: `linear-gradient(to bottom, ${tierColor}, ${tierColor}00)`,
                filter: "blur(3px)",
                animation: "nc-plume 1.5s ease-out both",
              }}
            />
            <svg
              className="nc-anim absolute left-1/2"
              width="22" height="34" viewBox="0 0 22 34"
              style={{ bottom: 40, marginLeft: -11, animation: "nc-lift 1.5s cubic-bezier(.4,0,.7,1) both" }}
            >
              <path d="M11 0 C15 7 17 15 17 22 L5 22 C5 15 7 7 11 0 Z" fill={C.star} />
              <path d="M5 22 L1 30 L5 28 Z M17 22 L21 30 L17 28 Z" fill={tierColor} />
              <circle cx="11" cy="12" r="2.6" fill={C.void} />
            </svg>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
        <div
          className="nc-anim w-full max-w-md rounded-3xl overflow-hidden relative"
          style={{
            background: C.hull,
            border: `1px solid ${tierColor}66`,
            boxShadow: `0 0 60px ${tierColor}33, 0 -8px 40px ${C.void}`,
            "--nc-glow-peak": `0 0 90px ${tierColor}88, 0 -8px 40px ${C.void}`,
            "--nc-glow-rest": `0 0 60px ${tierColor}33, 0 -8px 40px ${C.void}`,
            animation: entrance,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* Ignition bloom across the base of the card. */}
          {isPad && (
            <div
              className="nc-anim absolute inset-x-0 pointer-events-none"
              style={{
                bottom: 0, height: 90,
                background: `linear-gradient(to top, ${tierColor}AA, transparent)`,
                filter: "blur(10px)",
                animation: "nc-ignite 1.2s ease-out both",
              }}
            />
          )}

          {/* A ripple spreading out, for anything on the water. */}
          {zone.kind === "water" && (
            <div
              className="nc-anim absolute rounded-full pointer-events-none"
              style={{
                left: 28, top: 28, width: 56, height: 56, marginLeft: -6, marginTop: -6,
                border: `2px solid ${tierColor}`,
                animation: "nc-ripple 1.6s ease-out both",
              }}
            />
          )}
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

                {isHeavy && (
                  <div className="mt-2">
                    <Kicker color={C.plasma}>HEAVY DAY · TWO COMING HOME</Kicker>
                  </div>
                )}
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
