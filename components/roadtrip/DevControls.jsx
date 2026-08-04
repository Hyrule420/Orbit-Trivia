"use client";

import React from "react";
import { Play, Pause, SkipBack, MousePointerClick } from "lucide-react";
import { useC } from "../../lib/theme";
import { Panel, Kicker } from "./ui";

/* ============================================================
   Simulated drive controls.

   You cannot develop this mode by driving to Crystal River every time
   you change a line of code, so the simulator is not a nice-to-have —
   it is the only way to build the thing. It feeds the exact same
   position stream the real GPS does, so testing here genuinely tests
   the real code path.

   At 60x the whole 92-mile corridor replays in about a minute and a
   half, which is the loop you want when tuning zone triggers.
   ============================================================ */

const SPEEDS = [1, 10, 60];

export default function DevControls({ playing, speed, onSetSpeed, onTogglePlay, onRestart }) {
  const C = useC();

  return (
    <Panel className="p-3" style={{ background: C.hullLight }}>
      <div className="flex items-center justify-between mb-3">
        <Kicker>SIMULATED DRIVE</Kicker>
        <span className="flex items-center gap-1" style={{ color: C.dim, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
          <MousePointerClick size={11} /> TAP THE MAP TO JUMP
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePlay}
          className="flex items-center justify-center rounded-xl active:scale-95"
          style={{
            width: 44, height: 40, flexShrink: 0,
            background: playing ? `${C.abort}1F` : `${C.thrust}1F`,
            border: `1px solid ${playing ? C.abort : C.thrust}66`,
            color: playing ? C.abort : C.thrust,
          }}
          aria-label={playing ? "Pause the simulated drive" : "Start the simulated drive"}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>

        <button
          onClick={onRestart}
          className="flex items-center justify-center rounded-xl active:scale-95"
          style={{ width: 44, height: 40, flexShrink: 0, background: C.hull, border: `1px solid ${C.edge}`, color: C.dim }}
          aria-label="Back to the start of the route"
        >
          <SkipBack size={16} />
        </button>

        <div className="flex-1 flex gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className="flex-1 rounded-xl active:scale-95"
              style={{
                height: 40,
                background: speed === s ? `${C.ion}22` : C.hull,
                border: `1px solid ${speed === s ? C.ion : C.edge}`,
                color: speed === s ? C.ion : C.dim,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                letterSpacing: "0.08em",
              }}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}
