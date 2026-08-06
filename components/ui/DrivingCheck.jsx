"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import Confirm from "./Confirm";

/* ============================================================
   SCREENS
   ============================================================ */
export default function DrivingCheck({ onConfirm, onCancel }) {
  return (
    <Confirm
      icon={AlertTriangle}
      title="Behind the wheel?"
      confirmLabel="I'm a passenger — let's go"
      cancelLabel="Maybe later"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      Let a passenger hold the phone and answer for you — you can still call out the answers.
    </Confirm>
  );
}
