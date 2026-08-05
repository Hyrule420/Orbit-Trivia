"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useC } from "../../lib/theme";
import Panel from "./Panel";
import Btn from "./Btn";

/* ============================================================
   SCREENS
   ============================================================ */
export default function DrivingCheck({ onConfirm, onCancel }) {
  const C = useC();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "#000000cc" }}>
      <Panel style={{ maxWidth: 380, borderColor: `${C.abort}66` }} className="p-6">
        <div className="flex justify-center mb-4">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 56, height: 56, background: `${C.abort}22`, border: `1px solid ${C.abort}66` }}
          >
            <AlertTriangle size={26} style={{ color: C.abort }} />
          </div>
        </div>
        <h2 className="text-center mb-2" style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 22, color: C.star }}>
          Behind the wheel?
        </h2>
        <p className="text-center text-sm mb-6" style={{ color: C.dim, lineHeight: 1.6 }}>
          Let a passenger hold the phone and answer for you — you can still call out the answers.
        </p>
        <div className="flex flex-col gap-2">
          <Btn full onClick={onConfirm}>I'm a passenger — let's go</Btn>
          <Btn full variant="ghost" onClick={onCancel}>Maybe later</Btn>
        </div>
      </Panel>
    </div>
  );
}
