"use client";

import { createContext, useContext, useEffect, useState } from "react";

/* ============================================================
   MOTION — how much spectacle the player wants.

   Road Trip's launch pads throw a full-screen ignition sequence at
   you: ground shake, shockwave, a vehicle climbing out of the map.
   That is the point of the mode, and it is also exactly the sort of
   thing somebody in a moving car may want turned down.

   Three levels, deliberately not a boolean:

     full    everything — shake, full-screen sequence, sonic boom
     subtle  the arrival card's own effects, no screen-wide takeover
     off     no added motion at all; the app looks like it did before

   Shape mirrors lib/theme.js on purpose: a context with a sane
   default, read through one hook, so a component deep inside the
   road trip screen doesn't need the preference threaded to it.

   ---------------------------------------------------------------
   The operating system sets the DEFAULT. The player sets the answer.

   If the device asks for reduced motion, that is what we start on —
   nobody should be ambushed by a full-screen launch because they never
   found a settings screen. But it is a default, not a cage: once the
   player picks a level themselves, their choice wins and keeps
   winning.

   This used to treat the OS preference as an absolute override, which
   was a real bug rather than a strict reading of the spec. "Reduce
   Motion" is on for a lot of phones, and the effect was that every
   animation in the app was dead AND the control that turns them back
   on was greyed out — no way back, nothing explaining why. Somebody
   who goes looking for the switch and presses it has told you exactly
   what they want; refusing them is not accessibility.

   The system preference is *watched*, not sampled once at mount, so
   flipping it mid-session takes effect without a reload. That matters
   on a road trip, which is a screen people sit on for an hour.
   ============================================================ */

export const MOTION_LEVELS = ["full", "subtle", "off"];
export const MOTION_KEY = "orbit:motion";

const LABELS = { full: "Full", subtle: "Subtle", off: "Off" };
export const motionLabel = (level) => LABELS[level] || LABELS.full;

/* What the context carries. Defaults to full so a component rendered
   outside the provider still behaves like the app always has. */
export const MotionCtx = createContext({
  level: "full",
  stored: "full",
  systemReduced: false,
  full: true,
  subtle: false,
  off: false,
});

export const useMotion = () => useContext(MotionCtx);

const QUERY = "(prefers-reduced-motion: reduce)";

/* Live answer to "is the OS asking for less motion", kept in sync.
   Safari only grew addEventListener on MediaQueryList in 14, so the
   deprecated addListener is kept as a fallback — this app runs on
   iPhones that are not always new. */
export function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const sync = () => setReduced(mq.matches);
    sync();
    if (mq.addEventListener) {
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }
    mq.addListener(sync);
    return () => mq.removeListener(sync);
  }, []);

  return reduced;
}

/* Builds the value for MotionCtx.Provider. Kept as a hook rather than
   a component so OrbitTrivia.jsx can hold the stored level alongside
   soundOn and persist it the same way. */
export function useMotionValue(stored) {
  const systemReduced = useSystemReducedMotion();
  /* An explicit choice always wins. Only fall back to the device
     preference when the player has never picked for themselves. */
  const chosen = MOTION_LEVELS.includes(stored) ? stored : null;
  const level = chosen ?? (systemReduced ? "off" : "full");
  return {
    level,
    stored: chosen,
    systemReduced,
    /* True when the player is deliberately running more motion than the
       device asked for — the UI uses this to explain itself rather than
       to block anything. */
    overridingSystem: systemReduced && chosen !== null && chosen !== "off",
    full: level === "full",
    subtle: level === "subtle",
    off: level === "off",
  };
}

export const nextMotionLevel = (level) =>
  MOTION_LEVELS[(MOTION_LEVELS.indexOf(level) + 1) % MOTION_LEVELS.length];
