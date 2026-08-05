"use client";

import React from "react";
import { Rocket, Share } from "lucide-react";
import { useC } from "../../lib/theme";
import Panel from "./Panel";
import Btn from "./Btn";

export default function InstallHint({ onDismiss, androidPrompt }) {
  const C = useC();
  return (
    <Panel className="p-4 mb-3" style={{ borderColor: `${C.ion}44`, background: `${C.ion}0A` }}>
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 34, height: 34, background: `${C.ion}18`, border: `1px solid ${C.ion}44` }}
        >
          <Rocket size={16} style={{ color: C.ion, transform: "rotate(-45deg)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 15, color: C.star }}>
            Keep it on your home screen
          </div>
          <div className="text-sm mt-1" style={{ color: C.dim, lineHeight: 1.5 }}>
            {androidPrompt ? (
              "Install it and it opens fullscreen, like any other app."
            ) : (
              <>
                Tap <Share size={13} style={{ display: "inline", verticalAlign: "-2px", color: C.ion }} /> below,
                then <span style={{ color: C.star }}>Add to Home Screen</span>. It opens fullscreen and your streak
                stops expiring.
              </>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            {androidPrompt && (
              <Btn onClick={androidPrompt} style={{ padding: "8px 14px", fontSize: 13 }}>Install</Btn>
            )}
            <Btn variant="ghost" onClick={onDismiss} style={{ padding: "8px 14px", fontSize: 13 }}>
              {androidPrompt ? "Not now" : "Got it"}
            </Btn>
          </div>
        </div>
      </div>
    </Panel>
  );
}
