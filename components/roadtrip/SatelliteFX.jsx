"use client";

import React from "react";
import { useC } from "../../lib/theme";
import { SFX } from "../../lib/sfx";
import { buzz } from "../../lib/util";
import Starfield from "../art/Starfield";
import { useTimeline } from "./fxTimeline";

/* ============================================================
   SATELLITE BEACH — the whole history, going overhead.

   This town was named, with total sincerity, after the thing everyone
   living in it had come to build. It is the only place on the road
   named for an idea rather than a landmark, and it sits in the barest
   stretch of the corridor, so it gets the biggest sequence in the app:
   four satellites crossing the sky in launch order, 1957 to now.

     Sputnik 1    1957   a polished sphere with four whips trailing
     Explorer 1   1958   the first American one, launched from the Cape
                         a few miles north of here, tumbling as it did
     Telstar 1    1962   a faceted gold ball that carried live TV
     Starlink            a train of flat panels, still going up

   The argument the sequence is making is the distance between the
   first and the last, and the SOUND carries most of it: three slow
   beeps anyone could count, then a burst nobody can follow. If those
   ever start sounding alike, this stops being about anything.

   Same three rules as the other four sequences (see the header of
   PadLaunchFX.jsx): never takes a tap, never gates the question, never
   outlives the screen.
   ============================================================ */

const RUN_MS = 7300;

/* ---------- period colour ----------
   Hard-coded, not themed. Sputnik was polished aluminium because that
   is what 1957 aerospace metal looked like; Telstar was gold because
   of the foil over its solar cells. Running real hardware through the
   Mars palette would give rust-coloured spacecraft, which is the same
   reason the ocean in SurfFX and the hazard amber on the crawler are
   hard-coded too.

   The invented parts — the downlink beams, the glow behind the train,
   the closing flash — DO take tierColor. That split is the point: the
   three antiques are history the app has no opinion about, and the
   modern finale is where the app's own colour finally shows up. */
const ALU = "#C7CDD3";
const ALU_DARK = "#8A93A0";
const SHELL = "#EDEFF2";
const BAND = "#141518";
const GOLD = "#C9A227";
const GOLD_LIT = "#F0D998";
const PANEL = "#DCEBFF";

/* Each pass: how far down it starts, how high it climbs, how long it
   takes. They climb higher as the years advance, which is not subtle
   but is at least true.

   The whole band is pitched to sit over the MAP rather than up in the
   header — a satellite crossing behind the status line just looks like
   a rendering fault, and the map is the piece of sky the player is
   already looking at. */
const PASSES = [
  { key: "sputnik", top: "44vh", peak: "-9vh", delay: 0, dur: 1850 },
  { key: "explorer", top: "41vh", peak: "-11vh", delay: 1450, dur: 2000 },
  { key: "telstar", top: "38vh", peak: "-14vh", delay: 3050, dur: 2100 },
];

/* Sixteen, not the real twenty to sixty. Every one is a composited
   layer on a phone already holding a GPS fix, a wake lock and a map
   full of tiles, and sixteen already reads as a train. */
const TRAIN = 16;
const TRAIN_DELAY = 5150;
const TRAIN_DUR = 2100;

/* ---------- 1957 ---------- */
function Sputnik() {
  return (
    <svg width="58" height="28" viewBox="0 0 100 46" style={{ display: "block", overflow: "visible" }}>
      {/* four whip antennas, swept back to one side the way they flew */}
      <g stroke={ALU} strokeWidth="1.4" strokeLinecap="round" opacity="0.9">
        <line x1="62" y1="21" x2="6" y2="4" />
        <line x1="62" y1="22" x2="2" y2="17" />
        <line x1="62" y1="24" x2="2" y2="30" />
        <line x1="62" y1="25" x2="8" y2="42" />
      </g>
      <circle cx="72" cy="23" r="14" fill={ALU} />
      {/* the terminator across it, so it reads as a sphere not a disc */}
      <path d="M72 9 A14 14 0 0 1 72 37 A9 14 0 0 0 72 9 Z" fill={ALU_DARK} opacity="0.55" />
      <circle cx="67" cy="17" r="3.4" fill="#FFFFFF" opacity="0.75" />
    </svg>
  );
}

/* ---------- 1958 ---------- */
function Explorer1() {
  return (
    <svg width="80" height="26" viewBox="0 0 160 50" style={{ display: "block", overflow: "visible" }}>
      {/* turnstile antenna: four wires square to the body */}
      <g stroke={ALU} strokeWidth="1.3" strokeLinecap="round" opacity="0.85">
        <line x1="34" y1="25" x2="8" y2="6" />
        <line x1="34" y1="25" x2="8" y2="44" />
        <line x1="34" y1="25" x2="2" y2="20" />
        <line x1="34" y1="25" x2="2" y2="30" />
      </g>
      {/* the long thin cylinder — the real thing is about thirteen
          times longer than it is wide, which is most of its silhouette */}
      <rect x="30" y="18" width="112" height="14" rx="7" fill={SHELL} />
      {/* thermal banding, the barber-pole stripes it actually wore */}
      <g fill={BAND} opacity="0.92">
        <rect x="56" y="18" width="9" height="14" />
        <rect x="80" y="18" width="9" height="14" />
        <rect x="104" y="18" width="9" height="14" />
      </g>
      <path d="M142 18 L156 25 L142 32 Z" fill={ALU} />
      <rect x="30" y="18" width="112" height="4" rx="2" fill="#FFFFFF" opacity="0.28" />
    </svg>
  );
}

/* ---------- 1962 ---------- */
function Telstar() {
  return (
    <svg width="54" height="54" viewBox="0 0 96 96" style={{ display: "block", overflow: "visible" }}>
      <circle cx="48" cy="48" r="34" fill={GOLD} />
      {/* enough facet lines to read as a ball of solar cells without
          drawing every one of them at this size */}
      <g stroke={BAND} strokeWidth="1" opacity="0.35" fill="none">
        <path d="M48 14 L48 82 M14 48 L82 48" />
        <path d="M24 24 L72 72 M72 24 L24 72" />
        <circle cx="48" cy="48" r="18" />
      </g>
      <path d="M48 14 A34 34 0 0 1 48 82 A22 34 0 0 0 48 14 Z" fill={BAND} opacity="0.22" />
      <circle cx="36" cy="34" r="7" fill={GOLD_LIT} opacity="0.75" />
      {/* the antenna band around its middle */}
      <rect x="12" y="44" width="72" height="7" rx="3" fill={ALU_DARK} opacity="0.8" />
      <rect x="78" y="40" width="12" height="15" rx="2" fill={ALU} />
    </svg>
  );
}

export default function SatelliteFX({ tierColor, onDone }) {
  const C = useC();

  useTimeline((at) => {
    SFX.beacon(3);
    at(150, () => buzz([14, 34, 14]));
    at(1450, () => SFX.telemetry(0.6));
    at(3050, () => SFX.spaceAge());
    at(4900, () => SFX.whoosh());
    at(TRAIN_DELAY, () => { SFX.dataBurst(10); buzz([18, 40, 18, 40, 70]); });
    at(RUN_MS + 250, onDone);
  });

  const bodyFor = (key) =>
    key === "sputnik" ? <Sputnik /> : key === "explorer" ? <Explorer1 /> : <Telstar />;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Night sky. Reusing the home screen's Starfield rather than
          scattering our own dots — it is already absolute inset-0 and
          pointer-events none, so it drops straight in. Comets off: one
          crossing mid-sequence would compete with the thing the player
          is actually meant to be watching. */}
      <div
        className="nc-anim absolute inset-0"
        style={{ opacity: 0.55, animation: "edgepulse 7.3s ease-out both" }}
      >
        <Starfield comets={false} />
      </div>

      {/* the three antiques */}
      {PASSES.map((p) => (
        <React.Fragment key={p.key}>
          <div
            className="nc-anim absolute"
            style={{
              top: p.top, left: "-90px",
              "--peak": p.peak,
              animation: `sc-satpass ${p.dur}ms cubic-bezier(.4,.05,.6,.95) ${p.delay}ms both`,
              filter: `drop-shadow(0 0 10px ${tierColor}66)`,
              willChange: "transform",
            }}
          >
            {/* the wobble rides inside the arc, so the tumble does not
                drag the flight path around with it */}
            <div
              className="sc-sat-tumble relative"
              style={{ animation: `sc-sat-tumble ${p.key === "explorer" ? 900 : 2600}ms ease-in-out infinite` }}
            >
              {bodyFor(p.key)}
              <span
                className="sc-sat-blip absolute rounded-full"
                style={{
                  right: -3, top: -3, width: 6, height: 6,
                  background: C.star,
                  boxShadow: `0 0 8px ${C.star}`,
                  animation: `sc-sat-blip ${p.key === "telstar" ? 1500 : 1100}ms ease-in-out infinite`,
                }}
              />
            </div>
          </div>

          {/* the signal reaching down as it goes over. A sibling of the
              pass, not a child: a child would be carried along by the
              parent transform, and this has to stay where the satellite
              was when it was overhead. */}
          <div
            className="nc-anim absolute"
            style={{
              top: `calc(${p.top} + ${p.peak})`, left: "52%",
              width: 2, height: "15vh",
              background: `linear-gradient(to bottom, ${tierColor}, transparent)`,
              transformOrigin: "top",
              animation: `sc-downlink 520ms ease-out ${p.delay + p.dur * 0.5 - 260}ms both`,
            }}
          />
        </React.Fragment>
      ))}

      {/* the anticipation beat before the finale */}
      <div
        className="nc-anim absolute inset-x-0"
        style={{
          top: "34vh", height: "26vh",
          background: `radial-gradient(ellipse at 50% 60%, ${tierColor}33, transparent 70%)`,
          filter: "blur(20px)",
          animation: "edgepulse 900ms ease-out 4900ms both",
        }}
      />

      {/* ---- the train ----
          One moving wrapper, sixteen still children. Only the wrapper
          gets a transform animation; the panels animate opacity alone.
          Sixteen independent transforms is how this would have become
          a slideshow on a phone. */}
      <div
        className="nc-anim absolute"
        style={{
          top: "50vh", left: "-420px",
          "--peak": "-7vh",
          animation: `sc-startrain ${TRAIN_DUR}ms cubic-bezier(.35,.05,.65,.95) ${TRAIN_DELAY}ms both`,
          willChange: "transform",
        }}
      >
        {/* one shared glow behind the whole string, never sixteen */}
        <div
          className="absolute"
          style={{
            left: -30, top: -18, width: TRAIN * 24 + 70, height: 44,
            background: `linear-gradient(90deg, transparent, ${tierColor}44 40%, ${C.star}33)`,
            filter: "blur(9px)",
          }}
        />
        {Array.from({ length: TRAIN }, (_, i) => (
          <span
            key={i}
            className="sc-sat-blip absolute"
            style={{
              left: i * 24, top: 0,
              width: 11, height: 4,
              borderRadius: 2,
              background: `linear-gradient(90deg, transparent, ${PANEL} 60%, #FFFFFF 100%)`,
              /* staggered so the train shimmers along its length
                 rather than pulsing as one block */
              animation: `sc-sat-blip 1200ms ease-in-out ${i * 55}ms infinite`,
            }}
          />
        ))}
      </div>

      {/* the one moment the sequence is allowed to be branded */}
      <div
        className="nc-anim absolute inset-0"
        style={{ background: tierColor, animation: "sc-flash 560ms ease-out 6150ms both" }}
      />
    </div>
  );
}
