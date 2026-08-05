/* Four jagged shards that together tile a card. Shared fracture edges,
   so when they separate the background shows through real gaps. */
export const CARD_SHARDS = [
  { clip: "polygon(0% 0%, 48% 0%, 52% 20%, 46% 45%, 30% 40%, 14% 48%, 0% 44%)", x: "-14px", y: "-12px", r: "-3deg" },
  { clip: "polygon(48% 0%, 100% 0%, 100% 66%, 84% 70%, 68% 62%, 51% 70%, 46% 45%, 52% 20%)", x: "16px", y: "-9px", r: "2.5deg" },
  { clip: "polygon(0% 44%, 14% 48%, 30% 40%, 46% 45%, 51% 70%, 49% 100%, 0% 100%)", x: "-12px", y: "12px", r: "2deg" },
  { clip: "polygon(51% 70%, 68% 62%, 84% 70%, 100% 66%, 100% 100%, 49% 100%)", x: "14px", y: "11px", r: "-2.5deg" },
];

/* ============================================================
   HOME LAUNCH
   The ascent and the catch are driven by requestAnimationFrame,
   not by CSS keyframes, because a card has to break on the frame
   the nose actually crosses it — a fixed delay drifts on every
   different screen height. Everything tunable lives here.
   ============================================================ */
export const LAUNCH = {
  ignitionMs: 850,     // hold-down before release
  ascentSec: 1.55,     // pad to out-of-frame
  hangMs: 1500,        // debris floating, rocket out of sight
  descentSec: 2.2,     // re-entry, retro-burn, catch
  exitFactor: 1.9,     // screen heights travelled before turnaround
  armsCloseAt: 0.68,   // fraction of the descent when the chopsticks move
  shatterSec: 1.0,     // one card coming apart
  weldSec: 0.95,       // one card welding back
  spread: 3.2,         // debris throw, x the shard's base offset
  spread2: 3.6,        // drift limit while floating
};

/* the shared fracture edges of CARD_SHARDS, as one path in a
   0..100 box — drawn over a broken card so the cracks can glow */
export const CRACK_PATH =
  "M48 0 L52 20 L46 45 M0 44 L14 48 L30 40 L46 45 L51 70 L68 62 L84 70 L100 66 M51 70 L49 100";
