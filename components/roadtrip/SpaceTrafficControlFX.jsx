"use client";

import React from "react";
import { useC } from "../../lib/theme";
import { SFX } from "../../lib/sfx";
import { buzz } from "../../lib/util";
import { useTimeline } from "./fxTimeline";

/* ============================================================
   SPACE TRAFFIC CONTROL — Patrick Space Force Base.

   Patrick doesn't launch anything, which is exactly why it needs its
   own sequence rather than borrowing PadLaunchFX. The real job here is
   Space Launch Delta 45's other mission, the one that runs whether or
   not anything is on the pad: space domain awareness, the standing
   catalogue of everything in orbit. So the screen becomes a tracking
   scope. A sweep turns once past a handful of ordinary contacts —
   a beep and a label chip for each, the way any of them would read on
   a real display — and then keeps going a little further than a full
   turn and stops on one that doesn't get a routine tag. That one gets
   a reticle instead: the difference between cataloguing and tracking.

   UNK-091 isn't a real object. Nothing here is claiming a specific
   thing is up there right now — the point is what the mission looks
   like, not a fabricated sighting.

   Same three rules as the other four sequences (see the header of
   PadLaunchFX.jsx): never takes a tap, never gates the question, never
   outlives the screen.
   ============================================================ */

const SCOPE = 280;                 // scope diameter, px
const CENTER = SCOPE / 2;
const R_MAX = CENTER - 18;         // leave room for dots and chips

const SWEEP_REV = 1900;            // ms per revolution
const UNK_ANGLE = 100;             // where the sweep stops, not 360
const SWEEP_DUR = Math.round(((360 + UNK_ANGLE) / 360) * SWEEP_REV);

const LOCK_AT = SWEEP_DUR;
const LOCK_TAG_AT = LOCK_AT + 150;
const FLASH_AT = LOCK_AT + 970;
const DONE_AT = FLASH_AT + 800;

const DEG = Math.PI / 180;

/* Compass bearing to an offset from the scope centre: 0 is straight
   up, increasing clockwise, matching the sweep's own rotation. */
function polar(angleDeg, rFrac) {
  const a = angleDeg * DEG;
  const r = rFrac * R_MAX;
  return { x: Math.sin(a) * r, y: -Math.cos(a) * r };
}

/* Six routine contacts, tagged in the order the sweep reaches them.
   Each time carries the same math as UNK_ANGLE below: angle over 360,
   times SWEEP_REV. Written out rather than computed, the way PASSES
   is in SatelliteFX.jsx — there are few enough of these that spelling
   out the numbers is more honest than hiding the arithmetic. */
const CONTACTS = [
  { angle: 150, r: 0.45, label: "STARLINK", at: 792 },
  { angle: 190, r: 0.85, label: "GPS III", at: 1003 },
  { angle: 230, r: 0.32, label: "NOAA-21", at: 1214 },
  { angle: 270, r: 0.7, label: "SES-18", at: 1425 },
  { angle: 310, r: 0.55, label: "USSF-44", at: 1636 },
  { angle: 350, r: 0.8, label: "ISS", at: 1847 },
];

const UNK = { angle: UNK_ANGLE, r: 0.6, label: "UNK-091", at: 528 };

function LockReticle({ color }) {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" style={{ display: "block", overflow: "visible" }}>
      <g stroke={color} strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M2 10 V2 H10" />
        <path d="M24 2 H32 V10" />
        <path d="M32 24 V32 H24" />
        <path d="M10 32 H2 V24" />
      </g>
    </svg>
  );
}

export default function SpaceTrafficControlFX({ tierColor, onDone }) {
  const C = useC();

  useTimeline((at) => {
    SFX.telemetry(0.5);
    at(120, () => buzz([10, 18]));
    CONTACTS.forEach((cn) => at(cn.at, () => SFX.tick(0)));
    at(UNK.at, () => SFX.tick(0.6));
    at(LOCK_AT, () => { SFX.promo(); buzz([40, 30, 110]); });
    at(DONE_AT, onDone);
  });

  /* Every element below that needs to sit centred on a point AND run a
     transform-animating keyframe gets that split into two divs: an
     outer one that only ever sets a static left/top (the position),
     and an inner one that only ever sets animation (the motion). A
     single div carrying both a static transform and a CSS animation
     whose keyframes also touch transform loses the static one — the
     animation replaces it outright rather than composing with it.
     That bug is what put the whole scope 140px off-centre the first
     time this ran. Baking the dot size into the offset instead of
     translate(-50%,-50%) sidesteps it rather than re-inviting it. */
  const renderContact = (cn, key) => {
    const p = polar(cn.angle, cn.r);
    return (
      <div key={key} className="absolute" style={{ left: CENTER + p.x - 3.5, top: CENTER + p.y - 3.5 }}>
        <div
          className="nc-anim rounded-full"
          style={{
            width: 7, height: 7, background: tierColor, boxShadow: `0 0 8px ${tierColor}`,
            transformOrigin: "50% 50%",
            animation: `stc-ping 650ms ease-out ${cn.at}ms both`,
          }}
        />
        <div
          className="nc-anim absolute font-mono uppercase whitespace-nowrap"
          style={{
            left: 10, top: -6, fontSize: 9, letterSpacing: 0.4,
            color: C.star, background: `${C.void}CC`,
            border: `1px solid ${tierColor}66`, borderRadius: 3,
            padding: "1px 4px",
            animation: `stc-tag 950ms ease-out ${cn.at}ms both`,
          }}
        >
          {cn.label}
        </div>
      </div>
    );
  };

  const unkPos = polar(UNK.angle, UNK.r);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* No apostrophes, quotes or angle brackets in here — see the
          header of components/GlobalStyles.jsx and the build guard in
          scripts/check-styles.mjs. */}
      <style>{`
        @keyframes stc-sweep {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(var(--sweep-end)); }
        }
        @keyframes stc-ping {
          0%   { transform: scale(.4); opacity: 0; }
          25%  { transform: scale(1.35); opacity: 1; }
          60%  { transform: scale(1);   opacity: .85; }
          100% { transform: scale(1);   opacity: 0; }
        }
        @keyframes stc-tag {
          0%   { transform: translateY(4px); opacity: 0; }
          15%  { transform: translateY(0);   opacity: 1; }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes stc-lock-tag {
          0%   { transform: translateY(4px); opacity: 0; }
          100% { transform: translateY(0);   opacity: 1; }
        }
        @keyframes stc-lock-snap {
          0%   { transform: scale(1.8); opacity: 0; }
          40%  { transform: scale(1);   opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      {/* the console panel materialising over the map */}
      <div
        className="nc-anim absolute"
        style={{
          left: "50%", top: "40vh", width: SCOPE + 60, height: SCOPE + 60,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${C.void}CC 0%, ${C.void}88 62%, transparent 78%)`,
          animation: "edgepulse 4.2s ease-out both",
        }}
      />

      <div className="absolute" style={{ left: "50%", top: `calc(40vh - ${CENTER + 40}px)`, transform: "translate(-50%, 0)" }}>
        <div
          className="nc-anim font-mono uppercase"
          style={{
            fontSize: 11, letterSpacing: 1.2, color: tierColor,
            animation: "verdictIn 500ms ease-out both",
          }}
        >
          Eastern Range · Tracking
        </div>
      </div>

      <div className="absolute" style={{ left: "50%", top: "40vh", width: SCOPE, height: SCOPE, transform: "translate(-50%, -50%)" }}>
        <div className="nc-anim absolute inset-0" style={{ animation: "verdictIn 550ms ease-out 80ms both" }}>
          {/* rings, crosshair and tick marks */}
          <svg width={SCOPE} height={SCOPE} viewBox={`0 0 ${SCOPE} ${SCOPE}`} style={{ position: "absolute", inset: 0 }}>
            <circle cx={CENTER} cy={CENTER} r={R_MAX} fill={tierColor} opacity="0.04" />
            {[0.34, 0.67, 1].map((f, i) => (
              <circle key={i} cx={CENTER} cy={CENTER} r={R_MAX * f} fill="none" stroke={tierColor} strokeOpacity="0.28" strokeWidth="1" />
            ))}
            <line x1={CENTER} y1={CENTER - R_MAX} x2={CENTER} y2={CENTER + R_MAX} stroke={tierColor} strokeOpacity="0.22" strokeWidth="1" />
            <line x1={CENTER - R_MAX} y1={CENTER} x2={CENTER + R_MAX} y2={CENTER} stroke={tierColor} strokeOpacity="0.22" strokeWidth="1" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = i * 30;
              const outer = polar(a, 1);
              const inner = polar(a, 0.92);
              return (
                <line
                  key={i}
                  x1={CENTER + inner.x} y1={CENTER + inner.y}
                  x2={CENTER + outer.x} y2={CENTER + outer.y}
                  stroke={tierColor} strokeOpacity="0.4" strokeWidth="1.4"
                />
              );
            })}
          </svg>

          {/* the sweep, resting exactly on the flagged contact once it stops */}
          <div
            className="nc-anim absolute rounded-full"
            style={{
              inset: 0,
              "--sweep-end": `${360 + UNK_ANGLE}deg`,
              background: `conic-gradient(from 0deg, ${tierColor} 0deg, ${tierColor}00 34deg, transparent 360deg)`,
              opacity: 0.5,
              transformOrigin: "50% 50%",
              animation: `stc-sweep ${SWEEP_DUR}ms linear both`,
            }}
          />

          {CONTACTS.map((cn, i) => renderContact(cn, i))}
          {renderContact(UNK, "unk")}

          {/* the escalation: the same contact, revisited and boxed */}
          <div className="absolute" style={{ left: CENTER + unkPos.x - 17, top: CENTER + unkPos.y - 17 }}>
            <div
              className="nc-anim"
              style={{
                transformOrigin: "50% 50%",
                animation: `stc-lock-snap 450ms cubic-bezier(.2,.8,.3,1) ${LOCK_AT}ms both`,
              }}
            >
              <LockReticle color={C.abort} />
            </div>
          </div>
          {/* Anchored from the box's right edge and grown leftward, not
              placed with left and grown rightward: UNK_ANGLE sits in the
              right half of the scope, so a left-anchored chip ran off the
              edge of the phone on anything narrower than the desktop this
              was first drawn on. */}
          <div
            className="nc-anim absolute font-mono uppercase whitespace-nowrap"
            style={{
              right: CENTER - unkPos.x - 6, top: CENTER + unkPos.y - 20,
              fontSize: 10, letterSpacing: 0.6, fontWeight: 600,
              color: C.abort, background: `${C.void}E6`,
              border: `1px solid ${C.abort}99`, borderRadius: 3,
              padding: "2px 5px",
              animation: `stc-lock-tag 300ms ease-out ${LOCK_TAG_AT}ms both`,
            }}
          >
            UNK-091 · TRACKED
          </div>
        </div>
      </div>

      {/* the one moment this is allowed to feel like an alert */}
      <div
        className="nc-anim absolute inset-0"
        style={{ background: C.abort, animation: `sc-flash 500ms ease-out ${FLASH_AT}ms both` }}
      />
    </div>
  );
}
