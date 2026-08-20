"use client";

import React from "react";
import { useC } from "../../lib/theme";
import { useMotion } from "../../lib/motion";
import { TIER_META } from "../../lib/questions";
import { STAGES } from "../../lib/share";

/* ============================================================
   FLIGHT CARD
   Designed to be screenshotted. HUD corners, Earth → Mars
   trajectory, one bead per question. Correct fills. Miss stays
   a ring. Daily gets the "same ten" kicker; everything else
   stays quiet about that.
   ============================================================ */

const P0 = { x: 28, y: 96 };
const P1 = { x: 160, y: 8 };
const P2 = { x: 292, y: 32 };

function qPoint(t) {
  const u = 1 - t;
  return {
    x: u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x,
    y: u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y,
  };
}

function pathD() {
  return `M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`;
}

function HudCorners({ color }) {
  const arm = 14;
  const corners = [
    { x: 0, y: 0, dx: 1, dy: 1 },
    { x: 1, y: 0, dx: -1, dy: 1 },
    { x: 0, y: 1, dx: 1, dy: -1 },
    { x: 1, y: 1, dx: -1, dy: -1 },
  ];
  return (
    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" aria-hidden="true">
      {corners.map((c, i) => (
        <g key={i} transform={`translate(${c.x * 100}%, ${c.y * 100}%)`}>
          <path
            d={`M ${c.dx * 2} ${c.dy * (arm + 2)} L ${c.dx * 2} ${c.dy * 2} L ${c.dx * (arm + 2)} ${c.dy * 2}`}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </svg>
  );
}

export default function FlightCard({ report }) {
  const C = useC();
  const motion = useMotion();
  const answers = report.answers || [];
  const n = Math.max(answers.length, 1);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: `linear-gradient(180deg, ${C.hullLight} 0%, ${C.hull} 100%)`,
        border: `1px solid ${report.perfect ? C.ion : C.edge}`,
        boxShadow: report.perfect ? `0 0 40px ${C.ion}33` : `0 0 0 1px ${C.void}`,
      }}
    >
      <HudCorners color={`${C.ion}99`} />

      <div className="relative px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.ion, letterSpacing: "0.22em" }}>
              FLIGHT REPORT
            </div>
            <div className="mt-1" style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 22, color: C.star, letterSpacing: "0.04em" }}>
              {report.headline}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, marginTop: 2 }}>
              {report.dateLabel}
            </div>
          </div>
          <div className="text-right">
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: C.star, letterSpacing: "0.08em" }}>
              {report.id}
            </div>
            {report.perfect && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.ion, letterSpacing: "0.18em", marginTop: 4 }}>
                FLAWLESS
              </div>
            )}
          </div>
        </div>

        <svg viewBox="0 0 320 120" className="w-full mt-4" role="img" aria-label={report.climb.join(". ")}>
          <defs>
            <linearGradient id="traj" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor={C.ion} stopOpacity="0.9" />
              <stop offset="55%" stopColor={C.plasma} stopOpacity="0.9" />
              <stop offset="100%" stopColor={C.abort} stopOpacity="0.9" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path d={pathD()} fill="none" stroke={`${C.edge}`} strokeWidth="6" strokeLinecap="round" />
          <path d={pathD()} fill="none" stroke="url(#traj)" strokeWidth="1.75" strokeLinecap="round" opacity="0.9" />

          <circle cx={P0.x} cy={P0.y} r="7" fill={C.ion} filter="url(#glow)" />
          <circle cx={P0.x} cy={P0.y} r="3" fill={C.void} />
          <circle cx={P2.x} cy={P2.y} r="8" fill={C.abort} filter="url(#glow)" />
          <circle cx={P2.x} cy={P2.y} r="3.5" fill={C.void} />

          {answers.map((a, i) => {
            const t = 0.1 + (i / Math.max(n - 1, 1)) * 0.8;
            const p = qPoint(t);
            const col = C[TIER_META[a.d]?.key] || C.star;
            const delay = motion.off ? 0 : 0.12 + i * 0.07;
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="7"
                  fill={a.ok ? col : "transparent"}
                  stroke={col}
                  strokeWidth="2"
                  style={{
                    animation: motion.off ? "none" : `verdictIn .5s cubic-bezier(.2,.8,.2,1) ${delay}s both`,
                  }}
                />
              </g>
            );
          })}
        </svg>

        <div className={`flex px-1 -mt-1 ${answers.length && new Set(answers.map((a) => a.d)).size === 1 ? "justify-center" : "justify-between"}`}>
          {STAGES.map((s) => {
            const got = answers.filter((a) => a.d === s.d);
            const hits = got.filter((a) => a.ok).length;
            const col = C[TIER_META[s.d]?.key] || C.dim;
            if (!got.length) return null;
            return (
              <div key={s.d} className="text-center" style={{ minWidth: 72 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: col, letterSpacing: "0.16em" }}>
                  {s.name}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.star, marginTop: 2 }}>
                  {hits}/{got.length}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-5 mb-1">
          <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 48, color: C.star, lineHeight: 1, letterSpacing: "0.02em" }}>
            {Number(report.score || 0).toLocaleString("en-US")}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim, letterSpacing: "0.22em", marginTop: 4 }}>
            PTS
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.ion, marginTop: 10, letterSpacing: "0.08em" }}>
            {report.correct}/{report.total}
            {report.daily && report.streak > 0 ? `  ·  DAY ${report.streak}` : ""}
          </div>
        </div>

        {report.daily && (
          <div
            className="mt-4 text-center py-2"
            style={{
              borderTop: `1px solid ${C.edge}`,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: C.dim,
              letterSpacing: "0.18em",
            }}
          >
            SAME TEN AS EVERYONE ON EARTH
          </div>
        )}
      </div>
    </div>
  );
}
