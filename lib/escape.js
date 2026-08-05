import { shuffle } from "./util";
import { QUESTIONS } from "./questions";

/* ============================================================
   ESCAPE VELOCITY
   An endless run measured in real orbital physics. Every correct
   answer adds velocity, the multiplier climbs with the streak,
   and one wrong answer means gravity wins.

   The thresholds aren't invented: 7.8 km/s is low Earth orbit,
   11.2 is escape from Earth, 16.6 is escape from the Sun.
   ============================================================ */
export const ESCAPE = {
  gain: { Earthbound: 0.5, Orbit: 0.7, Martian: 0.95 },  // km/s before multipliers
  multStep: 0.04,
  timerStart: 15,
  timerFloor: 7,
  timerDrop: 0.4,   // seconds shaved off the clock each question
  /* Every threshold is a real figure, which is what makes the
     climb mean something. Roughly: orbit around Q9, escape around
     Q12, and Earth's own orbital speed at about Q22 — a long way
     out for anyone who gets there. */
  marks: [
    { at: 7.8, label: "LOW EARTH ORBIT" },
    { at: 11.2, label: "ESCAPE VELOCITY", big: true },
    { at: 16.6, label: "SOLAR ESCAPE" },
    { at: 29.8, label: "EARTH'S ORBITAL SPEED" },
  ],
};

/* The clock tightens as you climb — 15 seconds at the pad, 7 by
   the time you're deep into Martian territory. */
export const escapeTimer = (i) => Math.max(ESCAPE.timerFloor, Math.round(ESCAPE.timerStart - i * ESCAPE.timerDrop));

/* Questions get harder the higher you get: four Earthbound to
   start, eight Orbit through the middle, Martian from there on.
   Whatever's left over is appended so a freakishly long run can
   never run the deck dry. */
export const buildEscapeDeck = () => {
  const tier = (t) => shuffle(QUESTIONS.filter((q) => q.d === t));
  const ladder = [...tier("Earthbound").slice(0, 4), ...tier("Orbit").slice(0, 8), ...tier("Martian")];
  const used = new Set(ladder);
  return [...ladder, ...shuffle(QUESTIONS.filter((q) => !used.has(q)))];
};
