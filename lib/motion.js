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
   The operating system always wins.

   If the device asks for reduced motion, this reports "off" whatever
   is stored — and, unlike the rest of the app, it *keeps listening*.
   Every other reduced-motion check in this codebase reads matchMedia
   once at mount (components/home/Home.jsx, components/StarshipCatch.jsx)
   and never looks again, so turning the setting on mid-session does
   nothing until a reload. A road trip is a long-lived screen. Someone
   who reaches for that switch during a drive has a reason, and they
   should not have to restart the app to be heard.
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
  const level = systemReduced ? "off" : (MOTION_LEVELS.includes(stored) ? stored : "full");
  return {
    level,
    stored,
    systemReduced,
    full: level === "full",
    subtle: level === "subtle",
    off: level === "off",
  };
}

export const nextMotionLevel = (level) =>
  MOTION_LEVELS[(MOTION_LEVELS.indexOf(level) + 1) % MOTION_LEVELS.length];
