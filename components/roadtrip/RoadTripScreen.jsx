"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ArrowLeft, MapPin, Navigation, Trophy, Check, AlertTriangle, Play, Radio, RotateCcw, ChevronRight, Repeat, Map as MapIcon } from "lucide-react";
import { useC } from "../../lib/theme";
import { useMotion } from "../../lib/motion";
import { TIER_META } from "../../lib/questions";
import { heavyDay } from "../../lib/day";
import { buzz } from "../../lib/util";
import { CORRIDORS, CORRIDOR_BY_ID, DEFAULT_CORRIDOR_ID, zoneQuestions } from "../../lib/corridors";
import { checkPack } from "../../lib/geo";
import { usePositionSource } from "../../lib/usePositionSource";
import { useZoneWatcher } from "../../lib/useZoneWatcher";
import { Btn, Panel, Kicker, formatDistance } from "./ui";
import Confirm from "../ui/Confirm";
import DevControls from "./DevControls";
import MapPanel from "./MapPanel";
import ArrivalPopup from "./ArrivalPopup";
import PadLaunchFX from "./PadLaunchFX";
import BoosterLandingFX from "./BoosterLandingFX";
import CrawlerRolloutFX from "./CrawlerRolloutFX";
import SurfFX from "./SurfFX";
import SatelliteFX from "./SatelliteFX";
import SpaceTrafficControlFX from "./SpaceTrafficControlFX";
import WeekiWacheeFX from "./WeekiWacheeFX";
import TarponSpongeDocksFX from "./TarponSpongeDocksFX";
import CrystalRiverMoundsFX from "./CrystalRiverMoundsFX";
import GeoQuestionCard from "./GeoQuestionCard";
import QuestionCarousel from "./QuestionCarousel";
import { QueueBar, QueueList, ArrivalToast } from "./QueueBar";

/* ============================================================
   ROAD TRIP FLORIDA — the GPS mode.

   This screen owns everything about a trip: where we are, which
   questions are waiting, what has been answered, and the score.

   Views it moves between:
     picker   choose which road to drive
     intro    explain what we're about to do, and ask for location
     map      the live trip — this is where you spend the drive
     queue    the list of questions collected so far
     carousel picking between a landmark's several questions
     card     answering one question
     summary  end of trip

   The two behaviours that matter most, and why they are the way they
   are: arriving somewhere is loud (the pop-up), but answering is never
   rushed (the queue). Those are separate on purpose. Anything that
   would make a question demand attention from a moving car — a
   countdown, an auto-open, a forced tap — belongs in neither.
   ============================================================ */

/* Too many pop-ups in a row stops being delightful and starts being
   nagging, so past these limits arrivals downgrade to a small toast. */
const BURST_WINDOW_MS = 60000;
const BURST_LIMIT = 3;
const QUEUE_DEEP = 5;

const SAVE_DEBOUNCE_MS = 2000;

/* Small helpers around the storage shim set up in lib/storage.js.
   Every call is wrapped: storage can be full, disabled or blocked in
   private browsing, and none of that should end a road trip. */
async function loadJSON(key, fallback) {
  try {
    const v = await window.storage.get(key);
    return v?.value ? JSON.parse(v.value) : fallback;
  } catch (e) {
    return fallback;
  }
}
async function saveJSON(key, value) {
  try { await window.storage.set(key, JSON.stringify(value)); } catch (e) { /* session only */ }
}
async function loadRaw(key) {
  try {
    const v = await window.storage.get(key);
    return v?.value ?? null;
  } catch (e) {
    return null;
  }
}
async function saveRaw(key, value) {
  try { await window.storage.set(key, String(value)); } catch (e) { /* session only */ }
}

/* Progress is stored per corridor, so driving US-19 and driving the
   Space Coast keep separate queues, scores and answered lists. */
const tripKey = (corridorId) => `orbit:geo:trip:${corridorId}`;
const seenKey = (corridorId) => `orbit:geo:seen:${corridorId}`;

/* ------------------------------------------------------------
   Before corridors existed there was only one road, and its progress
   lived at the un-suffixed keys. Anyone who has already played has
   their Nature Coast history there.

   So: the first time we look for a corridor's progress and find
   nothing, fall back to the old key and copy it across. Skipping this
   would silently mark every place they had answered as unanswered
   again — no error, no warning, just lost progress.

   Only the Nature Coast can have old-format data; it was the only
   corridor that ever existed.
   ------------------------------------------------------------ */
async function loadCorridorProgress(corridorId) {
  const isLegacyCorridor = corridorId === "nature-coast";

  let trip = await loadJSON(tripKey(corridorId), null);
  let seen = await loadJSON(seenKey(corridorId), null);

  if (isLegacyCorridor && trip === null && seen === null) {
    const oldTrip = await loadRaw("orbit:geo:trip");
    const oldSeen = await loadRaw("orbit:geo:seen");
    if (oldTrip !== null || oldSeen !== null) {
      trip = await loadJSON("orbit:geo:trip", null);
      seen = await loadJSON("orbit:geo:seen", null);
      /* Write it forward so this only ever happens once. The old keys
         are left alone rather than deleted — they cost nothing, and
         keeping them means an older build of the app still works if
         someone ends up back on one. */
      if (trip !== null) await saveJSON(tripKey(corridorId), trip);
      if (seen !== null) await saveJSON(seenKey(corridorId), seen);
    }
  }

  return { trip, seen: seen ?? [] };
}

export default function RoadTripScreen({ onHome, optedIn, onOptIn, onTripEnd, geoBest = 0 }) {
  const C = useC();
  const motion = useMotion();

  const [view, setView] = useState("picker");
  const [loaded, setLoaded] = useState(false);
  /* Screen-local boot: we need last-corridor out of storage before
     loading any progress, or we'd load the default corridor's data and
     then immediately throw it away. */
  const [booted, setBooted] = useState(false);
  const [pickerCounts, setPickerCounts] = useState({});

  /* Which road we're driving. Everything about a region — its route,
     its zones, its map framing — hangs off this one object, so
     switching corridors is just switching this id. */
  const [corridorId, setCorridorId] = useState(DEFAULT_CORRIDOR_ID);
  const corridor = CORRIDOR_BY_ID[corridorId] || CORRIDOR_BY_ID[DEFAULT_CORRIDOR_ID];

  const [queue, setQueue] = useState([]);          // zone ids waiting
  const [answered, setAnswered] = useState({});    // id -> { correct, points }
  const [skipped, setSkipped] = useState([]);      // ids dismissed this trip
  const [seen, setSeen] = useState([]);            // ids answered on any trip, ever
  const [points, setPoints] = useState(0);

  const [arrival, setArrival] = useState(null);    // zone id showing the big pop-up
  const [toast, setToast] = useState(null);        // zone id showing the small toast
  const [playing, setPlaying] = useState(null);    // zone id being answered
  /* Which question of a multi-question landmark is on screen, and which
     ones have already been taken there. Keyed by zone id, because the
     saved trip stores ids only — never question text — so re-wording a
     question can never corrupt somebody's progress. */
  const [playingQ, setPlayingQ] = useState(0);
  const [answeredQ, setAnsweredQ] = useState({});
  const [padFx, setPadFx] = useState(null);        // zone id running a full-screen sequence
  const [confirmReset, setConfirmReset] = useState(false);

  const recentArrivalsRef = useRef([]);
  const saveTimerRef = useRef(null);
  const wakeLockRef = useRef(null);
  /* Ending a trip stops the position source, which clears `source`.
     Remembered here so the summary screen can put you back on whichever
     one you were actually using. */
  const lastSourceRef = useRef(null);

  const { pos, status, error, errorCode, source, simPlaying, simSpeed, setSimSpeed, api } = usePositionSource(corridor.route);

  /* ---------- content sanity check, development only ---------- */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const problems = checkPack(corridor.zones, corridor.route, corridor.bounds);
    if (problems.length) {
      console.warn(`[Road Trip] ${corridor.name} pack problems:\n` + problems.join("\n"));
    }
  }, [corridor]);

  /* ---------- load saved progress for whichever corridor is active ----------
     This re-runs on every corridor switch, which is what keeps the two
     roads' progress genuinely separate. `loaded` drops to false first so
     the save effect below can't fire with one corridor's state under
     another corridor's key. */
  /* ---------- once: which road were we last on, and how far through
     is each of them? Both are needed before the picker can render. ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const counts = {};
      for (const c of CORRIDORS) {
        const { seen } = await loadCorridorProgress(c.id);
        counts[c.id] = Array.isArray(seen) ? seen.length : 0;
      }
      const last = await loadRaw("orbit:geo:corridor");
      if (cancelled) return;
      setPickerCounts(counts);
      if (last && CORRIDOR_BY_ID[last]) setCorridorId(last);
      setBooted(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!booted) return;
    let cancelled = false;
    setLoaded(false);
    (async () => {
      const lastCorridor = await loadRaw("orbit:geo:corridor");
      const { trip, seen: seenIds } = await loadCorridorProgress(corridorId);
      if (cancelled) return;

      setQueue(trip && Array.isArray(trip.queue) ? trip.queue : []);
      setAnswered(trip && trip.answered && typeof trip.answered === "object" ? trip.answered : {});
      setSkipped(trip && Array.isArray(trip.skipped) ? trip.skipped : []);
      setAnsweredQ(trip && trip.answeredQ && typeof trip.answeredQ === "object" ? trip.answeredQ : {});
      setPoints(trip ? Number(trip.points) || 0 : 0);
      setSeen(Array.isArray(seenIds) ? seenIds : []);

      /* Remember which road they were last on, so returning players go
         straight back to it. */
      if (lastCorridor !== corridorId) saveRaw("orbit:geo:corridor", corridorId);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [booted, corridorId]);

  /* ---------- save progress, but not on every keystroke ---------- */
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveJSON(tripKey(corridorId), { queue, answered, answeredQ, skipped, points, startedAt: Date.now() });
      saveJSON(seenKey(corridorId), seen);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(saveTimerRef.current);
  }, [loaded, corridorId, queue, answered, answeredQ, skipped, points, seen]);

  /* ---------- if location was already granted, don't re-explain ----------
     This must only skip the INTRO screen, not the picker. The picker is
     how you choose which road to drive, and it has to show every time
     you enter the mode — otherwise a returning player who granted
     location once gets permanently locked onto whichever corridor
     happens to load by default. Picking a road sets view to "intro"
     (see the picker below), which is what lets this fire. */
  useEffect(() => {
    if (loaded && optedIn && view === "intro") {
      setView("map");
      api.startGps();
    }
    /* view is included so this also fires when picking the same road
       you're already on, where corridorId doesn't change and `loaded`
       never re-toggles. api is deliberately excluded — it's a fresh
       object every render, and including it would fire on every
       render rather than only on the transitions that matter. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, view, optedIn]);

  /* ---------- keep the screen awake during a real drive ---------- */
  useEffect(() => {
    const wantLock = view === "map" && source === "gps";
    let released = false;

    const acquire = async () => {
      try {
        if (!wantLock || typeof navigator === "undefined" || !navigator.wakeLock) return;
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch (e) { /* browser said no — the trip still works, the screen just sleeps */ }
    };
    acquire();

    /* The browser drops the lock whenever the tab is backgrounded, so
       take it again when we come back. */
    const onVisible = () => { if (!released && !document.hidden) acquire(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      try { wakeLockRef.current?.release?.(); } catch (e) { /* already gone */ }
      wakeLockRef.current = null;
    };
  }, [view, source]);

  /* ---------- which zones should never fire again ---------- */
  const skipIds = useMemo(
    () => new Set([...queue, ...Object.keys(answered), ...skipped, ...seen]),
    [queue, answered, skipped, seen]
  );

  /* ---------- arriving somewhere ---------- */
  /* handleEnter is called from deep inside the position watcher, where
     we deliberately don't want a dependency on `queue` or `arrival` —
     that would rebuild the callback on every fix and could re-fire
     zones. Mirroring both into refs keeps the callback stable. */
  const queueLenRef = useRef(0);
  const arrivalRef = useRef(null);
  /* Same reason: handleEnter must not be rebuilt when the motion
     setting changes, or a preference tap mid-drive could re-fire a zone. */
  const motionFullRef = useRef(motion.full);
  useEffect(() => { queueLenRef.current = queue.length; }, [queue]);
  useEffect(() => { arrivalRef.current = arrival; }, [arrival]);
  useEffect(() => { motionFullRef.current = motion.full; }, [motion.full]);

  const handleEnter = useCallback((zone) => {
    /* Queue it first, always. Whatever the passenger does or doesn't
       tap, the question cannot be lost — the pop-up is presentation. */
    setQueue((q) => (q.includes(zone.id) ? q : [...q, zone.id]));
    buzz([18, 40, 18]);

    const now = Date.now();
    const recent = [...recentArrivalsRef.current, now].filter((t) => now - t < BURST_WINDOW_MS);
    recentArrivalsRef.current = recent;

    /* Go quiet when arrivals are coming thick and fast, when there is
       already a backlog, or when a pop-up is still on screen.

       Launch pads are the exception. They cluster — six of them within
       a few miles around Kennedy — so the burst rule would mute exactly
       the arrivals people came for, turning Launch Complex 39A into a
       one-line toast. A pad ignores the burst count and the backlog,
       but still waits its turn if a pop-up is already up. */
    /* A zone that has a full-screen sequence waiting is one we have
       already decided is worth making a fuss about, so it gets the same
       exemption the launch pads do. Without this, Sebastian Inlet — the
       last stop on the road, by which point the queue is always deep —
       would downgrade to a toast every single time and its wave would
       never once play. */
    const headline = zone.kind === "pad" || !!zone.fx;
    const busy = headline
      ? arrivalRef.current !== null
      : recent.length > BURST_LIMIT ||
        queueLenRef.current >= QUEUE_DEEP ||
        arrivalRef.current !== null;

    /* Both refs are updated HERE rather than left to the effects below,
       because zones genuinely can arrive together — drive into a cluster
       around a launch complex and two fire on the same GPS tick. The
       effects don't run between those two calls, so without this the
       second arrival would see a stale "nothing showing", overwrite the
       first, and the first would never appear at all. Both would still
       be queued, so nothing was ever lost — but one arrival went
       invisible, which is what made overlapping zones look broken. */
    queueLenRef.current += 1;
    if (busy) {
      setToast(zone.id);
    } else {
      arrivalRef.current = zone.id;
      setArrival(zone.id);
      /* The full-screen launch and landing sequences ride on the pop-up,
         never on the toast. An arrival that got downgraded is one we have
         already decided not to make a fuss about — throwing a rocket
         across the screen anyway would be exactly the nagging the burst
         throttle exists to prevent. */
      if (zone.fx && motionFullRef.current) setPadFx(zone.id);
    }
  }, []);

  const { nearest, resetInside } = useZoneWatcher({
    pos, zones: corridor.zones, skipIds, onEnter: handleEnter,
  });

  /* ---------- answering ---------- */
  /* A landmark carrying several questions goes to the reel first so you
     can pick one; everywhere else drops straight into the question, the
     way it always has. */
  const playNow = useCallback((id) => {
    setArrival(null);
    setToast(null);
    setPadFx(null);
    setPlaying(id);
    const many = zoneQuestions(corridor.byId[id]).length > 1;
    setPlayingQ(0);
    setView(many ? "carousel" : "card");
  }, [corridor]);

  const saveForLater = useCallback(() => setArrival(null), []);

  const recordAnswer = useCallback((id, correct, gained) => {
    setAnswered((a) => ({ ...a, [id]: { correct, points: gained } }));
    setQueue((q) => q.filter((x) => x !== id));
    setSeen((s) => (s.includes(id) ? s : [...s, id]));
    setPoints((p) => p + gained);
    /* Remember which of a landmark's questions this was, so the reel can
       grey it out and open on one you have not taken. Answering any one
       of them is what clears the zone; the rest are optional. */
    setAnsweredQ((m) => {
      const had = m[id] || [];
      return had.includes(playingQ) ? m : { ...m, [id]: [...had, playingQ] };
    });
  }, [playingQ]);

  /* Safe to read `queue` directly: this only runs from a tap, which is
     always a render after the previous answer was recorded. */
  const playNext = useCallback(() => {
    const next = queue.find((id) => id !== playing);
    if (next) setPlaying(next);
    else { setPlaying(null); setView("map"); }
  }, [queue, playing]);

  const skipOne = useCallback((id) => {
    setQueue((q) => q.filter((x) => x !== id));
    setSkipped((s) => (s.includes(id) ? s : [...s, id]));
  }, []);

  /* ---------- starting and ending ---------- */
  const startGpsTrip = useCallback(() => {
    setView("map");
    api.startGps();
  }, [api]);

  /* Only remember "yes, use my location" once a real fix has actually
     arrived. Recording it on the button tap was a bug: if the phone
     then couldn't get a position, every future visit skipped the intro
     and dropped you straight onto a broken map with no way back to the
     simulated drive. */
  useEffect(() => {
    if (source === "gps" && status === "live" && !optedIn) onOptIn?.();
  }, [source, status, optedIn, onOptIn]);

  const startSimTrip = useCallback(() => {
    setView("map");
    api.startSim();
  }, [api]);

  const endTrip = useCallback(() => {
    setPadFx(null);
    lastSourceRef.current = source;
    api.stop();
    onTripEnd?.(points);
    setView("summary");
  }, [api, onTripEnd, points, source]);

  /* Put the car back on the road after the trip was stopped. Without
     this, both ways back to the map from the summary dropped you onto a
     dead one: endTrip calls api.stop(), which clears the source, so
     nothing was driving and no zone could ever fire again. */
  const resumeDriving = useCallback((fromStart) => {
    if (lastSourceRef.current === "gps") { api.startGps(); return; }
    if (fromStart) api.restartSim();
    api.startSim();
  }, [api]);

  const resetHistory = useCallback(async () => {
    setSeen([]);
    setAnswered({});
    setSkipped([]);
    setQueue([]);
    setAnsweredQ({});
    setPadFx(null);
    setPoints(0);
    recentArrivalsRef.current = [];
    resetInside();
    await saveJSON(seenKey(corridorId), []);
    await saveJSON(tripKey(corridorId), { queue: [], answered: {}, answeredQ: {}, skipped: [], points: 0 });
  }, [resetInside, corridorId]);

  /* Wipe the road and drive it from the top. This is the one that makes
     the mode replayable — without it, every place you have ever answered
     is in `seen` forever and the road goes quiet on the second lap. */
  const driveAgain = useCallback(async () => {
    setConfirmReset(false);
    await resetHistory();
    setView("map");
    resumeDriving(true);
  }, [resetHistory, resumeDriving]);

  const answeredIds = useMemo(() => Object.keys(answered), [answered]);
  const correctCount = useMemo(
    () => Object.values(answered).filter((a) => a.correct).length,
    [answered]
  );
  const remaining = corridor.zones.length - seen.length;

  /* ============================================================
     VIEWS
     ============================================================ */

  if (view === "carousel" && playing && corridor.byId[playing]) {
    return (
      <QuestionCarousel
        key={playing}
        zone={corridor.byId[playing]}
        answeredIdx={answeredQ[playing] || []}
        onPick={(i) => { setPlayingQ(i); setView("card"); }}
        onBackToMap={() => { setPlaying(null); setView("map"); }}
      />
    );
  }

  if (view === "card" && playing && corridor.byId[playing]) {
    const zoneQs = zoneQuestions(corridor.byId[playing]);
    const many = zoneQs.length > 1;
    return (
      /* key resets the card's internal "which answer did you pick" state
         when we move on — including between two questions on the same
         landmark, which is why the index is part of it */
      <GeoQuestionCard
        key={`${playing}:${playingQ}`}
        zone={corridor.byId[playing]}
        question={zoneQs[playingQ] || zoneQs[0]}
        queueRemaining={queue.filter((id) => id !== playing).length}
        onAnswered={recordAnswer}
        /* On a landmark, "next" goes back to the reel so you can take
           another from the same place if you want one. Everywhere else
           it moves on down the queue exactly as before. */
        onNext={many ? () => setView("carousel") : playNext}
        onBackToMap={() => { setPlaying(null); setView("map"); }}
      />
    );
  }

  if (view === "queue") {
    return (
      <QueueList
        queue={queue}
        answered={answered}
        byId={corridor.byId}
        onPlay={playNow}
        onSkip={skipOne}
        onBack={() => setView("map")}
      />
    );
  }

  if (view === "summary") {
    const isBest = points > geoBest;
    return (
      <div className="min-h-screen max-w-md mx-auto px-4 pt-8 pb-8">
        <div className="text-center mb-6">
          <Kicker color={C.ion}>{corridor.name.toUpperCase()} · {corridor.road}</Kicker>
          <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 28, color: C.star, marginTop: 6 }}>
            Trip complete
          </div>
        </div>

        <Panel className="p-6 mb-4" style={{ borderColor: `${C.ion}55` }}>
          <div className="text-center">
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 44, fontWeight: 700, color: C.ion }}>
              {points}
            </div>
            <Kicker>POINTS</Kicker>
            {isBest && points > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: `${C.thrust}1A`, border: `1px solid ${C.thrust}66` }}>
                <Trophy size={13} style={{ color: C.thrust }} />
                <Kicker color={C.thrust}>NEW BEST</Kicker>
              </div>
            )}
          </div>
        </Panel>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: "PASSED", value: answeredIds.length + queue.length + skipped.length },
            { label: "CORRECT", value: `${correctCount}/${answeredIds.length}` },
            { label: "LEFT", value: remaining },
          ].map((s) => (
            <Panel key={s.label} className="p-3 text-center">
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: C.star }}>{s.value}</div>
              <Kicker>{s.label}</Kicker>
            </Panel>
          ))}
        </div>

        {remaining === 0 && (
          <Panel className="p-4 mb-4" style={{ borderColor: `${C.plasma}55` }}>
            <Kicker color={C.plasma}>PACK COMPLETE</Kicker>
            <p className="text-sm mt-2" style={{ color: C.dim, lineHeight: 1.6 }}>
              You&apos;ve answered every question on the {corridor.name}. Drive it again to put every
              place back on the board, pick another road, or add more to <code>lib/corridors/</code>.
            </p>
          </Panel>
        )}

        <div className="flex flex-col gap-2">
          <Btn full onClick={() => setConfirmReset(true)}>
            <span className="inline-flex items-center justify-center gap-2">
              <RotateCcw size={15} /> Drive it again
            </span>
          </Btn>
          <Btn full variant="ghost" onClick={() => { setView("map"); resumeDriving(false); }}>
            Keep driving
          </Btn>
          <Btn full variant="ghost" onClick={onHome}>Back to the launchpad</Btn>
        </div>

        {confirmReset && (
          <Confirm
            icon={RotateCcw}
            tone={C.plasma}
            title="Recycle the count?"
            confirmLabel="Recycle — drive it again"
            cancelLabel="Hold the count"
            onConfirm={driveAgain}
            onCancel={() => setConfirmReset(false)}
          >
            Every place on the {corridor.name} goes back on the board — answered, skipped, all
            {" "}{corridor.zones.length} of them — and the score drops to zero. Your best run and every
            other road are untouched.
          </Confirm>
        )}
      </div>
    );
  }

  /* ---------- pick a road ---------- */
  if (view === "picker") {
    return (
      <div className="min-h-screen max-w-md mx-auto px-4 pt-5 pb-8">
        <button onClick={onHome} className="flex items-center gap-2 mb-6 active:scale-95" style={{ color: C.dim }}>
          <ArrowLeft size={17} />
          <Kicker>LAUNCHPAD</Kicker>
        </button>

        <h1 style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 26, color: C.star }}>
          Pick your road
        </h1>
        <p className="text-sm mt-1 mb-6" style={{ color: C.dim, lineHeight: 1.6 }}>
          Each one keeps its own score and remembers which places you&apos;ve already answered.
        </p>

        <div className="flex flex-col gap-3">
          {CORRIDORS.map((c) => {
            const done = pickerCounts[c.id] ?? 0;
            const total = c.zones.length;
            const complete = done >= total;
            return (
              <button
                key={c.id}
                onClick={() => { setCorridorId(c.id); setView("intro"); }}
                className="text-left active:scale-95 w-full"
              >
                <Panel className="p-5" style={{ borderColor: c.id === corridorId ? `${C.ion}66` : C.edge }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={15} style={{ color: complete ? C.thrust : C.ion }} />
                        <Kicker color={complete ? C.thrust : C.ion}>
                          {complete ? "ALL ANSWERED" : c.road}
                        </Kicker>
                      </div>
                      <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 20, color: C.star }}>
                        {c.name}
                      </div>
                      <div className="text-sm mt-1" style={{ color: C.dim, lineHeight: 1.5 }}>
                        {c.tagline}
                      </div>

                      {/* how far through this road you are */}
                      <div className="flex items-center gap-2 mt-3">
                        <div style={{ flex: 1, height: 3, borderRadius: 2, background: C.edge, overflow: "hidden" }}>
                          <div style={{ width: `${total ? (done / total) * 100 : 0}%`, height: "100%", background: complete ? C.thrust : C.ion }} />
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim }}>
                          {done}/{total}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={20} style={{ color: C.dim, marginTop: 20, flexShrink: 0 }} />
                  </div>
                </Panel>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---------- intro ---------- */
  if (view === "intro") {
    const noApi = typeof navigator !== "undefined" && !("geolocation" in navigator);
    return (
      <div className="min-h-screen max-w-md mx-auto px-4 pt-5 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onHome} className="flex items-center gap-2 active:scale-95" style={{ color: C.dim }}>
            <ArrowLeft size={17} />
            <Kicker>LAUNCHPAD</Kicker>
          </button>
          <button onClick={() => setView("picker")} className="flex items-center gap-2 active:scale-95" style={{ color: C.dim }}>
            <Repeat size={14} />
            <Kicker>CHANGE ROAD</Kicker>
          </button>
        </div>

        <div className="flex justify-center mb-5">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 64, height: 64, background: `${C.ion}1A`, border: `1px solid ${C.ion}66` }}
          >
            <MapPin size={30} style={{ color: C.ion }} />
          </div>
        </div>

        <div className="text-center mb-2">
          <Kicker color={C.ion}>{corridor.name.toUpperCase()} · {corridor.road}</Kicker>
        </div>
        <h1
          className="text-center mb-3"
          style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 27, color: C.star }}
        >
          Road Trip Florida
        </h1>
        <p className="text-center text-sm mb-6" style={{ color: C.dim, lineHeight: 1.65 }}>
          {corridor.tagline} Questions unlock as you drive past the real places along {corridor.road}
          {" "}— {corridor.zones.length} of them on this road.
        </p>

        <Panel className="p-4 mb-4">
          <div className="flex gap-3">
            <Radio size={16} style={{ color: C.thrust, flexShrink: 0, marginTop: 2 }} />
            <p className="text-sm" style={{ color: C.dim, lineHeight: 1.6 }}>
              Your location is used only while this screen is open, only on your phone.
              Nothing is sent anywhere and nothing is stored but the questions you&apos;ve answered.
            </p>
          </div>
        </Panel>

        <Panel className="p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle size={16} style={{ color: C.abort, flexShrink: 0, marginTop: 2 }} />
            <p className="text-sm" style={{ color: C.dim, lineHeight: 1.6 }}>
              Keep this screen open — phones stop tracking a hidden tab, so we&apos;ll hold the screen awake.
              Questions never pop open by themselves and there&apos;s no timer: whoever&apos;s riding shotgun answers
              when they feel like it.
            </p>
          </div>
        </Panel>

        {error && (
          <Panel className="p-4 mb-4" style={{ borderColor: `${C.abort}66` }}>
            <Kicker color={C.abort}>LOCATION UNAVAILABLE</Kicker>
            <p className="text-sm mt-2" style={{ color: C.dim, lineHeight: 1.6 }}>{error}</p>
          </Panel>
        )}

        <div className="flex flex-col gap-2">
          {!noApi && (
            <Btn full onClick={startGpsTrip}>
              <span className="inline-flex items-center justify-center gap-2">
                <Navigation size={16} /> Turn on location
              </span>
            </Btn>
          )}
          <Btn full variant="ghost" onClick={startSimTrip}>
            <span className="inline-flex items-center justify-center gap-2">
              <Play size={15} /> Take a simulated drive
            </span>
          </Btn>
        </div>
      </div>
    );
  }

  /* ---------- the live trip ---------- */
  const arrivalZone = arrival ? corridor.byId[arrival] : null;
  const toastZone = toast ? corridor.byId[toast] : null;
  const fxZone = padFx ? corridor.byId[padFx] : null;
  const fxTier = fxZone ? (TIER_META[fxZone.d] || TIER_META.Earthbound) : null;
  const simulating = source === "sim" || source === "manual";
  const offCorridor = nearest && nearest.distanceM > 80000;

  /* Work out what to actually tell someone whose location isn't working.
     "Location is off" was the old message for every one of these, which
     is useless when the phone's location genuinely IS on — the setting
     and the fix are two different things, and Airplane Mode breaks the
     second while leaving the first looking perfectly fine. */
  const gpsTrouble = (() => {
    if (source !== "gps") return null;
    if (status === "live" || status === "asking") return null;

    if (status === "insecure") {
      return {
        title: "NEEDS A SECURE CONNECTION",
        detail: "Browsers only hand out location over https. This page is on plain http, so the prompt never appears.",
        checks: ["Open this over an https link", "The Vercel preview link works — a local dev address usually won't"],
      };
    }
    if (status === "denied") {
      return {
        title: "PERMISSION REFUSED",
        detail: "Location services may well be on — this is the browser or the OS specifically refusing this site.",
        checks: [
          "iPhone: Settings → Privacy & Security → Location Services → Safari Websites → While Using",
          "iPhone: Settings → Safari → Location → Ask or Allow",
          "Reload the page and tap Allow when the prompt appears",
          "Private Browsing blocks location on some iOS versions",
        ],
      };
    }
    if (status === "unavailable") {
      return {
        title: "CAN'T GET A FIX",
        detail: "Permission is fine — your phone just can't work out where it is. On an iPhone this is almost always Airplane Mode, which switches the GPS radio off but leaves Wi-Fi on, so pages still load normally.",
        checks: [
          "Turn Airplane Mode off",
          "Check Settings → Privacy & Security → Location Services is on",
          "Step outside or near a window — indoors can be enough to block it",
        ],
      };
    }
    if (status === "searching") {
      return {
        title: "LOOKING FOR A SIGNAL",
        detail: "Your phone hasn't found a position yet. This usually sorts itself out — it's still trying.",
        checks: ["Airplane Mode will stop this working entirely", "Indoors and underground both block GPS", "Give it up to a minute outside"],
      };
    }
    return null;
  })();

  return (
    <div className="min-h-screen max-w-md mx-auto px-4 pt-5" style={{ paddingBottom: 110 }}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onHome} className="flex items-center gap-2 active:scale-95" style={{ color: C.dim }}>
          <ArrowLeft size={17} />
          <Kicker>LAUNCHPAD</Kicker>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => setView("picker")} className="flex items-center gap-1.5 active:scale-95" style={{ color: C.dim }}>
            <Repeat size={13} />
            <Kicker>ROAD</Kicker>
          </button>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: C.ion }}>
            {points}
          </span>
          <Kicker>PTS</Kicker>
        </div>
      </div>

      {/* Status line: what's driving the position right now, and how to
          change it. The simulated drive used to live only on the intro
          screen, which returning players never see again once they've
          granted location — so it became unreachable. It belongs here,
          next to the thing it switches. */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: status === "live" ? `${C.thrust}1A` : `${C.edge}66`,
            border: `1px solid ${status === "live" ? `${C.thrust}66` : C.edge}`,
          }}
        >
          <Radio size={11} style={{ color: status === "live" ? C.thrust : C.dim }} />
          <Kicker color={status === "live" ? C.thrust : C.dim}>
            {source === "gps" ? (status === "live" ? "LIVE GPS" : status.toUpperCase())
              : source === "sim" ? "SIMULATED"
              : source === "manual" ? "MAP PIN"
              : "IDLE"}
          </Kicker>
        </span>

        <button
          onClick={simulating ? startGpsTrip : startSimTrip}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full active:scale-95"
          style={{ background: `${C.edge}66`, border: `1px solid ${C.edge}` }}
        >
          {simulating
            ? <Navigation size={11} style={{ color: C.dim }} />
            : <Play size={11} style={{ color: C.dim }} />}
          <Kicker>{simulating ? "USE GPS" : "SIMULATE"}</Kicker>
        </button>

        <span style={{ color: C.dim, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
          {seen.length}/{corridor.zones.length}
        </span>
      </div>

      {/* The map gets its own copy of the ground shake.
          It has to be its own wrapper rather than something higher up the
          tree: a transform here would become the containing block for any
          `position: fixed` descendant, and the arrival card, the toast and
          the queue bar are all fixed. Shaking a shared ancestor would slide
          all three around the screen. MapPanel has no fixed children, so
          this is safe — and a CSS transform does not make Leaflet
          re-measure, so nothing here may call invalidateSize(). */}
      {/* Deliberately not keyed. Keying this to restart the shake would
          give MapPanel a new element identity and tear the Leaflet map
          down and rebuild it on every arrival — the exact remount the
          comment in MapPanel.jsx exists to prevent. The animation
          restarts on its own because the style goes away when padFx
          clears; two pad sequences overlapping back to back is the one
          case where the map doesn't re-shake, which is cosmetic. */}
      <div
        className={padFx ? "nc-anim" : undefined}
        style={
          padFx
            ? { "--shake": 4, animation: "sc-groundshake 1.7s cubic-bezier(.2,.6,.4,1) .12s both" }
            : undefined
        }
      >
        <MapPanel
          route={corridor.route}
          zones={corridor.zones}
          pos={pos}
          answeredIds={seen}
          queuedIds={queue}
          bounds={corridor.bounds}
          mars={C.id === "mars"}
          nearestId={nearest?.zone?.id}
          height={300}
          onTeleport={simulating ? api.teleport : undefined}
        />
      </div>

      {gpsTrouble && (
        <Panel className="p-4 mt-3" style={{ borderColor: `${C.abort}55` }}>
          <Kicker color={C.abort}>{gpsTrouble.title}</Kicker>
          <p className="text-sm mt-2" style={{ color: C.dim, lineHeight: 1.6 }}>
            {gpsTrouble.detail}
          </p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {gpsTrouble.checks.map((c) => (
              <li key={c} className="flex gap-2 text-sm" style={{ color: C.dim, lineHeight: 1.5 }}>
                <span style={{ color: C.ion }}>·</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-4">
            <Btn onClick={api.startGps}>Try again</Btn>
            <Btn variant="ghost" onClick={startSimTrip}>Simulated drive</Btn>
          </div>
          <p className="mt-3" style={{ color: C.dim, opacity: 0.6, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>
            {status.toUpperCase()}{errorCode ? ` · CODE ${errorCode}` : ""}
          </p>
        </Panel>
      )}

      {offCorridor && (
        <Panel className="p-4 mt-3" style={{ borderColor: `${C.plasma}55` }}>
          <Kicker color={C.plasma}>A LONG WAY FROM THE {corridor.name.toUpperCase()}</Kicker>
          <p className="text-sm mt-2" style={{ color: C.dim, lineHeight: 1.6 }}>
            Nearest question is {nearest.zone.place}, {formatDistance(nearest.distanceM)} away.
            This road only covers {corridor.road} — take the simulated drive to see it working,
            or pick a different road.
          </p>
          <div className="flex gap-2 mt-3">
            <Btn onClick={startSimTrip}>
              <span className="inline-flex items-center gap-2"><Play size={14} /> Simulated drive</span>
            </Btn>
            <Btn variant="ghost" onClick={() => setView("picker")}>Change road</Btn>
          </div>
        </Panel>
      )}

      {simulating && (
        <div className="mt-3">
          <DevControls
            playing={simPlaying}
            speed={simSpeed}
            onSetSpeed={setSimSpeed}
            onTogglePlay={api.toggleSimPlay}
            onRestart={api.restartSim}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { icon: <Check size={13} style={{ color: C.thrust }} />, label: "CORRECT", value: `${correctCount}/${answeredIds.length}` },
          { icon: <MapIcon size={13} style={{ color: C.ion }} />, label: "WAITING", value: queue.length },
          { icon: <Trophy size={13} style={{ color: C.plasma }} />, label: "BEST", value: Math.max(geoBest, points) },
        ].map((s) => (
          <Panel key={s.label} className="p-3 text-center">
            <div className="flex justify-center mb-1">{s.icon}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: C.star }}>{s.value}</div>
            <Kicker>{s.label}</Kicker>
          </Panel>
        ))}
      </div>

      <div className="mt-4">
        <Btn full variant="ghost" onClick={endTrip}>End trip</Btn>
      </div>

      <QueueBar queue={queue} nearest={nearest} byId={corridor.byId} onOpen={() => setView("queue")} />

      {toastZone && !arrivalZone && (
        <ArrivalToast zone={toastZone} onDone={() => setToast(null)} />
      )}

      {/* The full-screen sequences go BEFORE the pop-up so they sit under
          it in the stacking order as well as in the source. Both are
          pointer-events: none at z-30, under the card's z-50, so every
          button on the card stays live for the whole thing. Keyed on the
          zone id: a fresh arrival is a fresh mount, which is what the
          one-shot timeline in fxTimeline.js assumes. */}
      {fxZone && fxZone.fx === "launch" && (
        <PadLaunchFX
          key={fxZone.id}
          zone={fxZone}
          tierColor={C[fxTier.key]}
          onDone={() => setPadFx(null)}
        />
      )}

      {fxZone && fxZone.fx === "landing" && (
        <BoosterLandingFX
          key={fxZone.id}
          tierColor={C[fxTier.key]}
          heavy={heavyDay()}
          onDone={() => setPadFx(null)}
        />
      )}

      {fxZone && fxZone.fx === "rollout" && (
        <CrawlerRolloutFX
          key={fxZone.id}
          zone={fxZone}
          tierColor={C[fxTier.key]}
          onDone={() => setPadFx(null)}
        />
      )}

      {fxZone && fxZone.fx === "surf" && (
        <SurfFX key={fxZone.id} onDone={() => setPadFx(null)} />
      )}

      {fxZone && fxZone.fx === "satellites" && (
        <SatelliteFX
          key={fxZone.id}
          tierColor={C[fxTier.key]}
          onDone={() => setPadFx(null)}
        />
      )}

      {fxZone && fxZone.fx === "tracking" && (
        <SpaceTrafficControlFX
          key={fxZone.id}
          tierColor={C[fxTier.key]}
          onDone={() => setPadFx(null)}
        />
      )}

      {fxZone && fxZone.fx === "mermaids" && (
        <WeekiWacheeFX key={fxZone.id} onDone={() => setPadFx(null)} />
      )}

      {fxZone && fxZone.fx === "divers" && (
        <TarponSpongeDocksFX key={fxZone.id} onDone={() => setPadFx(null)} />
      )}

      {fxZone && fxZone.fx === "mounds" && (
        <CrystalRiverMoundsFX key={fxZone.id} onDone={() => setPadFx(null)} />
      )}

      {arrivalZone && (
        <ArrivalPopup
          zone={arrivalZone}
          queueCount={Math.max(0, queue.length - 1)}
          onPlayNow={playNow}
          onSaveForLater={saveForLater}
          bigFx={padFx === arrivalZone.id}
        />
      )}
    </div>
  );
}
