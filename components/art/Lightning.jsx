"use client";

import React from "react";

/* Blue electrical discharge — origin at the center of the button,
   forking outward the way a real strike branches. */
const BOLT_CORE = "#EAF6FF";   // white-hot channel
const BOLT_GLOW = "#3FA9FF";   // blue halo
const BOLT_HALO = "#0A6BE0";   // deep blue outer bloom

const BOLT_ANGLES = [8, 52, 128, 172, 216, 262, 308, 340];

/* Build a jagged path from the center outward toward an angle,
   with a fork partway along. Deterministic so it doesn't jitter on re-render. */
function makeBolt(angleDeg, reach, seed) {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const rad = (angleDeg * Math.PI) / 180;
  const cx = 50, cy = 50;
  const segs = 5;
  let x = cx, y = cy;
  let d = `M${cx},${cy}`;
  const pts = [[cx, cy]];
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const dist = reach * t;
    const jitter = (rnd() - 0.5) * 26 * (1 - t * 0.45);
    const perp = rad + Math.PI / 2;
    x = cx + Math.cos(rad) * dist + Math.cos(perp) * jitter;
    y = cy + Math.sin(rad) * dist + Math.sin(perp) * jitter;
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
    pts.push([x, y]);
  }
  // fork off the third node
  const [fx, fy] = pts[2];
  const forkAngle = rad + (rnd() > 0.5 ? 0.55 : -0.55);
  const fLen = reach * 0.42;
  let fd = `M${fx.toFixed(1)},${fy.toFixed(1)}`;
  for (let i = 1; i <= 3; i++) {
    const t = i / 3;
    const jitter = (rnd() - 0.5) * 16;
    const perp = forkAngle + Math.PI / 2;
    const nx = fx + Math.cos(forkAngle) * fLen * t + Math.cos(perp) * jitter;
    const ny = fy + Math.sin(forkAngle) * fLen * t + Math.sin(perp) * jitter;
    fd += ` L${nx.toFixed(1)},${ny.toFixed(1)}`;
  }
  return { main: d, fork: fd };
}

export default function Lightning({ active }) {
  if (!active) return null;
  const bolts = BOLT_ANGLES.map((a, i) => ({
    ...makeBolt(a, 44 + (i % 3) * 9, 1337 + i * 977),
    delay: (i % 4) * 0.045,
  }));

  const Stroke = ({ d, width, color, opacity, blur, delay }) => (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      style={{
        filter: blur ? `blur(${blur}px)` : "none",
        animation: `strike .5s ease-out ${delay}s both`,
      }}
    />
  );

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ overflow: "visible", zIndex: 2 }}
      aria-hidden="true"
    >
      <svg
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: 300,
          height: 300,
          marginLeft: -150,
          marginTop: -150,
          overflow: "visible",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* three passes per bolt: outer bloom, blue channel, white core */}
        {bolts.map((b, i) => (
          <g key={`halo-${i}`}>
            <Stroke d={b.main} width={7} color={BOLT_HALO} opacity={0.5} blur={3} delay={b.delay} />
            <Stroke d={b.fork} width={5} color={BOLT_HALO} opacity={0.4} blur={3} delay={b.delay + 0.03} />
          </g>
        ))}
        {bolts.map((b, i) => (
          <g key={`glow-${i}`}>
            <Stroke d={b.main} width={3.2} color={BOLT_GLOW} opacity={0.95} blur={0.6} delay={b.delay} />
            <Stroke d={b.fork} width={2.2} color={BOLT_GLOW} opacity={0.85} blur={0.6} delay={b.delay + 0.03} />
          </g>
        ))}
        {bolts.map((b, i) => (
          <g key={`core-${i}`}>
            <Stroke d={b.main} width={1.1} color={BOLT_CORE} opacity={1} delay={b.delay} />
            <Stroke d={b.fork} width={0.8} color={BOLT_CORE} opacity={0.9} delay={b.delay + 0.03} />
          </g>
        ))}
      </svg>

      {/* discharge flash at the origin point */}
      <div
        className="absolute rounded-full"
        style={{
          left: "50%",
          top: "50%",
          width: 90,
          height: 90,
          marginLeft: -45,
          marginTop: -45,
          background: `radial-gradient(circle, ${BOLT_CORE} 0%, ${BOLT_GLOW}99 28%, ${BOLT_HALO}44 55%, transparent 72%)`,
          animation: "flash .45s ease-out both",
        }}
      />
    </div>
  );
}
