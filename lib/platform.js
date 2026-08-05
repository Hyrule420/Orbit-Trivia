/* ============================================================
   ADD TO HOME SCREEN
   iOS never prompts on its own — the player has to be told the
   Share sheet exists. Android fires a real install event we can
   trigger from a button, so both paths are handled here.
   ============================================================ */
export const isInstalled = () => {
  if (typeof window === "undefined") return false;
  return window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
};

/* Only Safari on iOS can add to the home screen. Chrome and
   Firefox on iOS can't, so showing them the instructions would
   just be wrong. iPads report themselves as Macs now, hence the
   touch-point check. */
export const isIOSSafari = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const otherBrowser = /crios|fxios|edgios|opios|opr\//i.test(ua);
  return ios && !otherBrowser;
};
