"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useC } from "../../lib/theme";
import Panel from "./Panel";
import Btn from "./Btn";

/* ============================================================
   CONFIRM — "are you sure?", in the shape this app already uses.

   There was one of these hard-coded inside DrivingCheck.jsx, and the
   trip summary needed a second. Rather than have two dialogs drift
   apart, the shell lives here and the callers bring their own words.

   Deliberately not dismissible by tapping the backdrop. Both things
   that use it are asking a question with a real consequence — am I
   driving, am I about to wipe my progress — and a stray tap on the
   scrim should not be able to answer either of them.
   ============================================================ */
export default function Confirm({
  icon: Icon = AlertTriangle,
  tone,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  const C = useC();
  const color = tone || C.abort;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "#000000cc" }}>
      <Panel style={{ maxWidth: 380, borderColor: `${color}66` }} className="p-6">
        <div className="flex justify-center mb-4">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 56, height: 56, background: `${color}22`, border: `1px solid ${color}66` }}
          >
            <Icon size={26} style={{ color }} />
          </div>
        </div>
        <h2
          className="text-center mb-2"
          style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 22, color: C.star }}
        >
          {title}
        </h2>
        <p className="text-center text-sm mb-6" style={{ color: C.dim, lineHeight: 1.6 }}>
          {children}
        </p>
        <div className="flex flex-col gap-2">
          <Btn full onClick={onConfirm}>{confirmLabel}</Btn>
          <Btn full variant="ghost" onClick={onCancel}>{cancelLabel}</Btn>
        </div>
      </Panel>
    </div>
  );
}
