"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { bearingDeg, moveTowards, nearestOnRoute, distanceM } from "./geo";

/* ============================================================
   WHERE ARE WE?

   This hook is the single answer to that question, and it hides which
   of three things actually produced the answer:

     "gps"    the real phone, via navigator.geolocation
     "sim"    a pretend car driving the route at your desk
     "manual" you tapped a spot on the map

   Everything else in the road trip mode reads the same object no matter
   which one is running. That is deliberate: it means testing on the
   simulator genuinely tests the real code path, rather than some
   special "dev mode" that behaves differently in the car.

   Shape of `pos`:
     { lat, lng, headingDeg, speedMps, accuracyM, source, t }
   ============================================================ */

/* The simulated car drives at about 60 mph. */
const SIM_BASE_MPS = 27;
const SIM_TICK_MS = 1000;

export function usePositionSource(route) {
  const [pos, setPos] = useState(null);
  const [status, setStatus] = useState("idle");
  /* idle | asking | live | searching | denied | unavailable | insecure */
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);
  const [simPlaying, setSimPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(10);

  /* Refs, not state: these change constantly and must never cause a
     re-render on their own. */
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const prevRef = useRef(null);
  const simSpeedRef = useRef(simSpeed);
  const cursorRef = useRef(null); // { index, lat, lng } along the route

  useEffect(() => { simSpeedRef.current = simSpeed; }, [simSpeed]);

  /* ---------- shared: publish a new fix ---------- */
  const publish = useCallback((next) => {
    const prev = prevRef.current;
    /* Phones report heading as null when stationary, and most laptops
       never report it at all, so fall back to the direction we have
       actually moved since the last fix. */
    let headingDeg = next.headingDeg;
    if ((headingDeg === null || headingDeg === undefined) && prev) {
      if (distanceM(prev.lat, prev.lng, next.lat, next.lng) > 5) {
        headingDeg = bearingDeg(prev.lat, prev.lng, next.lat, next.lng);
      } else {
        headingDeg = prev.headingDeg ?? 0;
      }
    }
    const fix = { ...next, headingDeg: headingDeg ?? 0, t: Date.now() };
    prevRef.current = fix;
    setPos(fix);
  }, []);

  /* ---------- teardown helpers ---------- */
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      try { navigator.geolocation.clearWatch(watchIdRef.current); } catch (e) { /* already gone */ }
      watchIdRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    clearWatch();
    setSimPlaying(false);
    setSource(null);
    setStatus("idle");
  }, [clearTimer, clearWatch]);

  /* ---------- the simulated drive ---------- */
  const ensureCursor = useCallback(() => {
    if (!cursorRef.current && route?.length) {
      cursorRef.current = { index: 0, lat: route[0][0], lng: route[0][1] };
    }
    return cursorRef.current;
  }, [route]);

  const simTick = useCallback(() => {
    const cursor = ensureCursor();
    if (!cursor || !route?.length) return;

    /* How far the car travels this tick. */
    let remaining = SIM_BASE_MPS * simSpeedRef.current * (SIM_TICK_MS / 1000);

    /* Walk forward along the route, hopping to the next corner whenever
       we run past the one we were heading for. */
    while (remaining > 0 && cursor.index < route.length - 1) {
      const target = route[cursor.index + 1];
      const step = moveTowards(cursor.lat, cursor.lng, target[0], target[1], remaining);
      cursor.lat = step.lat;
      cursor.lng = step.lng;
      if (step.overshoot > 0) {
        cursor.index += 1;
        remaining = step.overshoot;
      } else {
        remaining = 0;
      }
    }

    const reachedEnd = cursor.index >= route.length - 1;
    const ahead = route[Math.min(cursor.index + 1, route.length - 1)];

    publish({
      lat: cursor.lat,
      lng: cursor.lng,
      headingDeg: bearingDeg(cursor.lat, cursor.lng, ahead[0], ahead[1]),
      speedMps: reachedEnd ? 0 : SIM_BASE_MPS,
      accuracyM: 8,
      source: "sim",
    });

    if (reachedEnd) {
      clearTimer();
      setSimPlaying(false);
    }
  }, [route, publish, ensureCursor, clearTimer]);

  const startSim = useCallback(() => {
    clearWatch();
    clearTimer();
    ensureCursor();
    setSource("sim");
    setStatus("live");
    setError(null);
    setSimPlaying(true);
    simTick();
    timerRef.current = setInterval(simTick, SIM_TICK_MS);
  }, [clearWatch, clearTimer, ensureCursor, simTick]);

  const pauseSim = useCallback(() => {
    clearTimer();
    setSimPlaying(false);
  }, [clearTimer]);

  const toggleSimPlay = useCallback(() => {
    if (timerRef.current !== null) pauseSim();
    else startSim();
  }, [pauseSim, startSim]);

  const restartSim = useCallback(() => {
    if (!route?.length) return;
    cursorRef.current = { index: 0, lat: route[0][0], lng: route[0][1] };
    prevRef.current = null;
    publish({
      lat: route[0][0], lng: route[0][1],
      headingDeg: null, speedMps: 0, accuracyM: 8, source: "sim",
    });
  }, [route, publish]);

  /* ---------- tapping the map ---------- */
  const teleport = useCallback((lat, lng) => {
    /* Snap the simulator onto the nearest bit of road, so that pressing
       play afterwards carries on down the highway rather than driving
       off across a swamp. */
    if (route?.length) {
      const near = nearestOnRoute(lat, lng, route);
      cursorRef.current = { index: near.index, lat, lng };
    }
    setSource((s) => (s === "gps" ? s : "manual"));
    setStatus("live");
    publish({ lat, lng, headingDeg: null, speedMps: 0, accuracyM: 10, source: "manual" });
  }, [route, publish]);

  /* ---------- the real thing ---------- */
  const startGps = useCallback(() => {
    clearTimer();
    setSimPlaying(false);
    setError(null);

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unavailable");
      setError("This browser can't do location at all.");
      return;
    }

    /* Browsers only hand out location over HTTPS. Testing from a phone
       on http://192.168.x.x:3000 fails silently with no prompt, which is
       baffling the first time it happens — so say so plainly. */
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setStatus("insecure");
      setError("Location needs a secure (https) connection. On a phone, open this over https or use a tunnel.");
      return;
    }

    setStatus("asking");
    setSource("gps");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (p) => {
        setStatus("live");
        setError(null);
        publish({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          headingDeg: Number.isFinite(p.coords.heading) ? p.coords.heading : null,
          speedMps: Number.isFinite(p.coords.speed) ? p.coords.speed : 0,
          accuracyM: p.coords.accuracy ?? 999,
          source: "gps",
        });
      },
      (err) => {
        if (err.code === 1) {
          setStatus("denied");
          setError("Location is turned off for this site.");
          clearWatch();
        } else {
          /* Code 2 (position unavailable) and 3 (timeout) are usually
             temporary — a tunnel, a parking garage, a bad patch of sky.
             Keep the watch running; it recovers by itself. */
          setStatus("searching");
          setError(null);
        }
      },
      {
        /* High accuracy is deliberately OFF. Our zones are 2.5 km wide,
           so a 30 m fix is as good as a 5 m one — and high accuracy is
           the single biggest battery cost in this whole mode. */
        enableHighAccuracy: false,
        maximumAge: 5000,
        timeout: 20000,
      }
    );
  }, [clearTimer, clearWatch, publish]);

  /* ---------- battery: don't track a backgrounded tab ---------- */
  useEffect(() => {
    const onVisibility = () => {
      if (typeof document === "undefined") return;
      if (document.hidden) {
        clearWatch();
        clearTimer();
      } else if (source === "gps" && status !== "denied") {
        startGps();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [source, status, startGps, clearWatch, clearTimer]);

  /* Always tidy up on unmount. React's development Strict Mode mounts
     every component twice on purpose, so a leaked interval here would
     make the simulated car travel at double speed — a genuinely
     confusing bug to chase. */
  useEffect(() => () => {
    clearTimer();
    clearWatch();
  }, [clearTimer, clearWatch]);

  return {
    pos,
    status,
    error,
    source,
    simPlaying,
    simSpeed,
    setSimSpeed,
    api: { startGps, startSim, pauseSim, toggleSimPlay, restartSim, teleport, stop },
  };
}
