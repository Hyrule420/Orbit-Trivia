"use client";

import React from "react";

/* ============================================================
   GLOBAL KEYFRAMES
   Every animated component in the app references these by name.

   This stays a rendered <style> element rather than moving to
   app/globals.css on purpose. The CSS file is processed by PostCSS
   and lands in <head> ahead of Tailwind's preflight, which would
   reorder the cascade for the two global rules at the top. This file
   has already cost one hydration bug over how a <style> block is
   delivered (see app/layout.jsx) — not worth reopening to save a
   component.

   Fonts are loaded as real <link> tags in app/layout.jsx, not via
   @import in this <style> block — see the comment there for why.

   ------------------------------------------------------------
   NOTHING inside the template literal below may contain any of

       "     '     <     >

   not even in a comment. React escapes all four when it serialises
   text, and <style> is a raw-text element, so the browser never
   decodes them back. The CSS arrives corrupted AND the server and
   client markup disagree, which fails hydration on every load — the
   whole tree gets thrown away and re-rendered on the client.

   This file has now cost that bug three times: an apostrophe in prose,
   quoted attribute selectors, and the characters <html> written in a
   comment. Say "the root element" instead, and leave attribute values
   unquoted — [data-motion=off] is valid CSS and needs no quotes.

   There is a guard for this: `npm run check:styles`, which also runs
   as part of `npm run build`.
   ============================================================ */
export default function GlobalStyles() {
  return (
    <style>{`
      * { -webkit-tap-highlight-color: transparent; }
      button:focus-visible, input:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
      /* real strikes flicker — bright, stutter, re-strike, fade */
      @keyframes strike {
        0%   { opacity: 0; }
        6%   { opacity: 1; }
        14%  { opacity: .25; }
        22%  { opacity: 1; }
        38%  { opacity: .5; }
        48%  { opacity: 1; }
        70%  { opacity: .7; }
        100% { opacity: 0; }
      }
      @keyframes flash {
        0%   { transform: scale(.3); opacity: 0; }
        12%  { transform: scale(1);  opacity: .95; }
        30%  { transform: scale(1.1); opacity: .4; }
        45%  { transform: scale(1.2); opacity: .7; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      @keyframes urgent {
        0%, 100% { opacity: 1; }
        50%      { opacity: .4; }
      }
      @keyframes countIn {
        0%   { transform: scale(1.9); opacity: 0; }
        40%  { transform: scale(1);   opacity: 1; }
        100% { transform: scale(1);   opacity: 1; }
      }
      @keyframes blaze {
        0%, 100% { transform: rotate(-45deg) scale(1); }
        50%      { transform: rotate(-45deg) scale(1.14); }
      }
      @keyframes flicker {
        from { transform: scaleY(1) translateY(0);      opacity: .7; }
        to   { transform: scaleY(1.3) translateY(2px);  opacity: 1; }
      }
      @keyframes liftoff {
        0%   { transform: translateY(0); }
        28%  { transform: translateY(0); }
        45%  { transform: translateY(-14vh); }
        100% { transform: translateY(-160vh); }
      }
      @keyframes padshake {
        0%, 100% { transform: translateX(0); }
        25%      { transform: translateX(-2px); }
        75%      { transform: translateX(2px); }
      }
      @keyframes plume {
        from { opacity: .85; transform: scaleY(1); }
        to   { opacity: 1;   transform: scaleY(1.18); }
      }
      @keyframes smokeout {
        0%   { transform: translateY(0) scale(.6);      opacity: 0; }
        18%  { opacity: .85; }
        100% { transform: translateY(-52px) scale(2.2); opacity: 0; }
      }
      @keyframes skyfall {
        0%   { transform: translateY(0);      opacity: 0; }
        15%  { opacity: .55; }
        100% { transform: translateY(130vh);  opacity: 0; }
      }
      @keyframes verdictIn {
        0%   { transform: scale(.7) translateY(12px); opacity: 0; }
        100% { transform: scale(1)  translateY(0);    opacity: 1; }
      }
      @keyframes screenshake {
        0%, 100% { transform: translateX(0); }
        20%      { transform: translateX(-5px); }
        40%      { transform: translateX(4px); }
        60%      { transform: translateX(-3px); }
        80%      { transform: translateX(2px); }
      }
      @keyframes promoPop {
        0%   { transform: scale(.6);  opacity: 0; }
        12%  { transform: scale(1.06); opacity: 1; }
        20%  { transform: scale(1); }
        78%  { opacity: 1; }
        100% { transform: scale(1);  opacity: 0; }
      }
      @keyframes countBeat {
        0%   { transform: scale(2.2); opacity: 0; }
        18%  { transform: scale(1);   opacity: 1; }
        75%  { transform: scale(1);   opacity: 1; }
        100% { transform: scale(.88); opacity: .35; }
      }
      /* brief visible window inside a long cycle = an occasional comet */
      @keyframes comet {
        0%   { transform: translate(0, 0) rotate(14deg);          opacity: 0; }
        1%   { opacity: 0; }
        3%   { opacity: .9; }
        7%   { opacity: .9; }
        9%   { transform: translate(150vw, 34vh) rotate(14deg);   opacity: 0; }
        100% { transform: translate(150vw, 34vh) rotate(14deg);   opacity: 0; }
      }
      @keyframes speedFloat {
        0%   { transform: translateY(14px) scale(.8); opacity: 0; }
        20%  { transform: translateY(0) scale(1.08);  opacity: 1; }
        32%  { transform: translateY(0) scale(1); }
        70%  { transform: translateY(-6px);          opacity: 1; }
        100% { transform: translateY(-26px);         opacity: 0; }
      }
      @keyframes edgepulse {
        0%   { opacity: 0; }
        30%  { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes drift {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50%      { transform: translateY(-3px) rotate(-5deg); }
      }
      @keyframes miniLaunch {
        0%   { transform: translateY(0); }
        14%  { transform: translateY(2px); }
        100% { transform: translateY(-105vh); }
      }
      @keyframes miniReturn {
        0%   { transform: translateY(-64px); opacity: 0; }
        60%  { transform: translateY(3px);   opacity: 1; }
        100% { transform: translateY(0);     opacity: 1; }
      }
      @keyframes shatter {
        0%   { transform: translate(0, 0) rotate(0deg); }
        18%  { transform: translate(calc(var(--sx) * .3), calc(var(--sy) * .3)) rotate(calc(var(--sr) * .5)); }
        60%  { transform: translate(var(--sx), var(--sy)) rotate(var(--sr)); }
        100% { transform: translate(var(--sx), var(--sy)) rotate(var(--sr)); }
      }
      @keyframes reassemble {
        0%   { transform: translate(var(--sx), var(--sy)) rotate(var(--sr)); filter: none; }
        70%  { transform: translate(0, 0) rotate(0deg); filter: brightness(1.7); }
        100% { transform: translate(0, 0) rotate(0deg); filter: none; }
      }
      @keyframes cardvanish { from { opacity: 1; } to { opacity: 0; } }
      @keyframes cardreturn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes chargeup {
        0%   { transform: scale(1); }
        35%  { transform: scale(1.035); }
        100% { transform: scale(1); }
      }
      /* ---- home launch sequence ----
         Spread is driven by --spread / --spread2 so the throw distance can be
         tuned from the LAUNCH block in JS without touching these rules. */
      /* a freshly broken edge glows, then cools while the piece drifts */
      @keyframes edgeCool {
        0%   { opacity: 0;   filter: brightness(2.4); }
        18%  { opacity: 1;   filter: brightness(2.4); }
        100% { opacity: .45; filter: brightness(1); }
      }
      /* ...and goes white-hot as the pieces meet, then fades out welded */
      @keyframes weldSeam {
        0%   { opacity: .45; filter: brightness(1); }
        70%  { opacity: .9;  filter: brightness(1.8); }
        84%  { opacity: 1;   filter: brightness(3.4) drop-shadow(0 0 7px #FFFFFF); }
        92%  { opacity: .8;  filter: brightness(2.2); }
        100% { opacity: 0;   filter: brightness(1); }
      }
      @keyframes padBloom {
        0%, 100% { transform: scaleX(1);    opacity: .8; }
        50%      { transform: scaleX(1.14); opacity: 1; }
      }
      @keyframes extremeShatter {
        0%   { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; filter: brightness(1.4); }
        16%  { transform: translate(calc(var(--sx) * .5), calc(var(--sy) * .5)) rotate(calc(var(--sr) * 1.1)) scale(1.02); opacity: 1; }
        65%  { transform: translate(calc(var(--sx) * var(--spread)), calc(var(--sy) * var(--spread))) rotate(calc(var(--sr) * 3.4)) scale(.93); opacity: .55; }
        100% { transform: translate(calc(var(--sx) * var(--spread)), calc(var(--sy) * var(--spread))) rotate(calc(var(--sr) * 4)) scale(.9); opacity: .3; filter: none; }
      }
      @keyframes zeroFloat {
        0%   { transform: translate(calc(var(--sx) * var(--spread)),  calc(var(--sy) * var(--spread)))  rotate(calc(var(--sr) * 4))   scale(.9);  opacity: .3; }
        50%  { transform: translate(calc(var(--sx) * var(--spread2)), calc(var(--sy) * var(--spread2))) rotate(calc(var(--sr) * 4.8)) scale(.88); opacity: .2; }
        100% { transform: translate(calc(var(--sx) * var(--spread)),  calc(var(--sy) * var(--spread)))  rotate(calc(var(--sr) * 4))   scale(.9);  opacity: .3; }
      }
      @keyframes hardSnap {
        0%   { transform: translate(calc(var(--sx) * var(--spread)), calc(var(--sy) * var(--spread))) rotate(calc(var(--sr) * 4)) scale(.9); opacity: .3; }
        35%  { opacity: 1; }
        80%  { transform: translate(0, 0) rotate(0deg) scale(1.02); opacity: 1; filter: brightness(1.5); }
        100% { transform: translate(0, 0) rotate(0deg) scale(1);    opacity: 1; filter: none; }
      }
      /* ---- road trip: launch pads and landing zones ----
         Used by components/roadtrip/PadLaunchFX.jsx and
         BoosterLandingFX.jsx. Everything here animates transform and
         opacity only: these run full-screen on a phone that is also
         holding a GPS fix, a wake lock and a map full of tiles, and
         anything that makes the browser re-paint rather than re-composite
         shows up immediately as dropped frames. Blur is set once and
         never animated, for the same reason. */

      /* the pressure wave going out — fast, then it runs out of energy */
      @keyframes sc-shock {
        0%   { transform: scale(.06); opacity: 0; }
        8%   { opacity: .85; }
        60%  { opacity: .35; }
        100% { transform: scale(1);   opacity: 0; }
      }
      /* Ground shake. Longer and messier than screenshake above, which is a
         quick UI knock — this one has to read as the pad letting go, so
         it moves on both axes and decays instead of stopping dead.
         --shake scales the whole thing so one keyframe covers the heavy
         first second and the aftershock. */
      @keyframes sc-groundshake {
        0%   { transform: translate(0, 0); }
        8%   { transform: translate(calc(var(--shake) * -1px), calc(var(--shake) * .6px)); }
        17%  { transform: translate(calc(var(--shake) * .9px),  calc(var(--shake) * -.5px)); }
        26%  { transform: translate(calc(var(--shake) * -.75px), calc(var(--shake) * -.7px)); }
        38%  { transform: translate(calc(var(--shake) * .6px),  calc(var(--shake) * .55px)); }
        52%  { transform: translate(calc(var(--shake) * -.45px), calc(var(--shake) * .35px)); }
        68%  { transform: translate(calc(var(--shake) * .3px),  calc(var(--shake) * -.25px)); }
        84%  { transform: translate(calc(var(--shake) * -.15px), calc(var(--shake) * .12px)); }
        100% { transform: translate(0, 0); }
      }
      /* A booster falls engines-last and canted, then pitches upright for
         the burn. The overshoot at 78% is the flip going slightly past
         vertical and settling back, which is what it actually looks like. */
      @keyframes sc-flip {
        0%   { transform: rotate(var(--cant)); }
        55%  { transform: rotate(calc(var(--cant) * .45)); }
        78%  { transform: rotate(-4deg); }
        100% { transform: rotate(0deg); }
      }
      /* Touchdown dust: thrown outward and low, then it hangs and thins.
         Distinct from smokeout above, which drifts upward — dust off a
         landing pad goes sideways first because that is where the
         exhaust sends it. */
      @keyframes sc-dust {
        0%   { transform: translateX(0) scaleX(.2) scaleY(.5); opacity: 0; }
        14%  { opacity: .8; }
        100% { transform: translateX(var(--dx)) scaleX(2.6) scaleY(1.5); opacity: 0; }
      }
      /* A booster coming home. Falls fast, then the burn takes almost all
         of it out in the last stretch — the stops are bunched at the end
         because a suicide burn arrives at zero velocity and zero altitude
         at the same moment, rather than slowing gently the whole way. */
      @keyframes sc-descend {
        0%   { transform: translateY(-108vh); opacity: 0; }
        7%   { opacity: 1; }
        58%  { transform: translateY(-30vh); }
        80%  { transform: translateY(-9vh); }
        93%  { transform: translateY(-1.2vh); }
        100% { transform: translateY(0); }
      }
      /* The landing burn: lights, holds while it kills the velocity,
         and cuts the instant the legs are down. */
      @keyframes sc-burn {
        0%   { opacity: 0; transform: scaleY(.15); }
        14%  { opacity: 1; transform: scaleY(1); }
        76%  { opacity: 1; transform: scaleY(.85); }
        100% { opacity: 0; transform: scaleY(.1); }
      }
      /* The crawler-transporter creeping across the screen. Linear on
         purpose — no ease-in, no ease-out — because the real thing moves
         at a near-constant mile an hour and the whole point of it is
         that it never hurries. translateX rather than left/right so it
         stays compositor-only like everything else in this block. */
      @keyframes sc-crawl {
        0%   { transform: translateX(0); }
        100% { transform: translateX(calc(100vw + 420px)); }
      }
      /* The flash the shock front puts across everything for a frame or two. */
      @keyframes sc-flash {
        0%   { opacity: 0; }
        6%   { opacity: .5; }
        100% { opacity: 0; }
      }

      /* ---- honouring reduce-motion, without trapping anyone ----
         Two rules doing one job.

         The media query is the default and covers the first paint,
         before any JavaScript has run. It deliberately stops applying
         once the player has explicitly asked for Full or Subtle — that
         choice is theirs to make, and this rule used to override it,
         which left the animations dead with no way to bring them back.

         The attribute rule covers the resolved setting once the app is
         running: data-motion is written onto the root element by
         OrbitTrivia.jsx and lands on off both when the player chose Off
         and when the device asked and they never overrode it. */
      @media (prefers-reduced-motion: reduce) {
        html:not([data-motion=full]):not([data-motion=subtle]) * {
          transition-duration: .01ms !important; animation-duration: .01ms !important;
        }
      }
      html[data-motion=off] * {
        transition-duration: .01ms !important; animation-duration: .01ms !important;
      }
    `}</style>
  );
}
