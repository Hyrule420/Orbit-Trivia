"use client";

import React, { useState, useEffect } from "react";
import GlobalStyles from "@/components/GlobalStyles";
import { THEMES, ThemeCtx } from "@/lib/theme";
import { MotionCtx, useMotionValue, nextMotionLevel, MOTION_KEY, MOTION_LEVELS } from "@/lib/motion";
import { QUESTIONS } from "@/lib/questions";
import { SFX } from "@/lib/sfx";
import { storage } from "@/lib/storage";
import { todayKey, liveDayStreak, bumpDayStreak } from "@/lib/day";
import { ESCAPE, buildEscapeDeck } from "@/lib/escape";
import { emptySkill, parseSkill, applyAnswers, SKILL_STORAGE_KEY } from "@/lib/skill";
import { isInstalled, isIOSSafari } from "@/lib/platform";
import DrivingCheck from "@/components/ui/DrivingCheck";
import PlanetPicker from "@/components/screens/PlanetPicker";
import Welcome from "@/components/screens/Welcome";
import ProfileScreen from "@/components/screens/ProfileScreen";
import CustomSetup from "@/components/screens/CustomSetup";
import Results from "@/components/screens/Results";
import EscapeResults from "@/components/screens/EscapeResults";
import Game from "@/components/Game";
import Home from "@/components/home/Home";
import RoadTripScreen from "@/components/roadtrip/RoadTripScreen";


/* ============================================================
   HELPERS
   ============================================================ */


/* ============================================================
   ROOT
   ============================================================ */
export default function OrbitTrivia() {
  const [themeId, setThemeId] = useState(null);
  const [booted, setBooted] = useState(false);
  const [screen, setScreen] = useState("home");
  const [pendingMode, setPendingMode] = useState(null);
  const [config, setConfig] = useState(null);
  const [mode, setMode] = useState("daily");
  const [results, setResults] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [stats, setStats] = useState({ best: 0, streak: 0, runs: 0 });
  const [dailyDone, setDailyDone] = useState(false);
  const [profile, setProfile] = useState({ name: "", handle: "", model: "" });
  const [dayStreakData, setDayStreakData] = useState({ lastDate: null, current: 0, best: 0 });
  const [streakMilestone, setStreakMilestone] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  /* How much spectacle the player wants.

     Starts as null meaning "never chosen", which is NOT the same as
     "full": while it is null the device's own reduced-motion preference
     picks the level, and once the player taps the control their choice
     takes over for good. Defaulting this to "full" made every session
     look like a deliberate choice and the device preference never got a
     say. See lib/motion.js. */
  const [motionLevel, setMotionLevel] = useState(null);
  const motion = useMotionValue(motionLevel);
  const [escapeBest, setEscapeBest] = useState(0);
  /* The road trip keeps its own best score and its own "yes to location"
     flag. Deliberately separate from `stats` — an untimed, open-ended mode
     would make the timed-run numbers meaningless if it were mixed in. */
  const [geoBest, setGeoBest] = useState(0);
  const [geoOptIn, setGeoOptIn] = useState(false);
  const [skill, setSkill] = useState(emptySkill);
  const [installDismissed, setInstallDismissed] = useState(false);
  /* Whether this device has ever gotten past the Welcome screen, by
     either starting First Orbit or skipping it. Separate from stats.runs
     -- see showWelcome below -- and separate from replayWelcome, which is
     a manual, on-demand re-show that doesn't touch this persisted flag. */
  const [welcomed, setWelcomed] = useState(false);
  const [replayWelcome, setReplayWelcome] = useState(false);
  const [androidEvt, setAndroidEvt] = useState(null);

  /* Android and desktop Chrome fire this when the site qualifies as
     installable. Holding onto it lets a real Install button work. */
  useEffect(() => {
    const grab = (e) => { e.preventDefault(); setAndroidEvt(e); };
    window.addEventListener("beforeinstallprompt", grab);
    const done = () => setAndroidEvt(null);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", grab);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  /* Whether the platform can install this at all, independent of whether
     the one-shot nudge below has been dismissed -- Home uses this to decide
     whether to show a permanent header icon that reopens the same panel on
     demand, so dismissing the nudge doesn't mean losing the option. */
  const canInstall = !isInstalled() && (androidEvt !== null || isIOSSafari());

  /* Used to wait until someone had finished a run, on the theory that
     asking a first-time visitor to install something they haven't played
     yet gets it dismissed forever. Turned off for the beta: these are
     invited testers, not cold organic traffic, so the priority is making
     "yes, put it on your home screen" as unmissable as possible from the
     very first load rather than waiting to earn it. */
  const showInstall = !installDismissed && canInstall;

  const dismissInstall = async () => {
    setInstallDismissed(true);
    try { await storage.set("orbit:installhint", "off"); } catch (e) { /* session only */ }
  };

  const runAndroidInstall = androidEvt
    ? async () => {
        try {
          androidEvt.prompt();
          await androidEvt.userChoice;
        } catch (e) { /* dismissed */ }
        setAndroidEvt(null);
        dismissInstall();
      }
    : null;

  /* Browsers refuse to start audio until the player has touched the
     screen at least once. This listens for that first touch anywhere
     and opens the audio system inside it, so nothing is swallowed. */
  useEffect(() => {
    const open = () => SFX.unlock();
    window.addEventListener("pointerdown", open);
    window.addEventListener("touchstart", open);
    /* Coming back from the home screen, a phone call, or a locked
       screen leaves audio interrupted — try to bring it back rather
       than waiting for the player to notice it's gone. */
    const wake = () => { if (!document.hidden) SFX.revive(); };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("pageshow", wake);
    window.addEventListener("focus", wake);
    return () => {
      window.removeEventListener("pointerdown", open);
      window.removeEventListener("touchstart", open);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pageshow", wake);
      window.removeEventListener("focus", wake);
    };
  }, []);

  /* Publish the resolved level to <html> so stylesheets can honour it.
     The CSS cannot ask the motion context, and several components kill
     their own animations from inside a @media (prefers-reduced-motion)
     block — which would otherwise keep firing even after the player has
     explicitly asked for motion back. Keyed on the resolved level, so
     "off" covers both "they chose off" and "the device asked and they
     never overrode it". */
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.motion = motion.level;
  }, [motion.level]);

  useEffect(() => { SFX.setEnabled(soundOn); }, [soundOn]);
  useEffect(() => { if (themeId) SFX.setTheme(themeId); }, [themeId]);

  useEffect(() => {
    (async () => {
      try {
        const s = await storage.get("orbit:sound");
        if (s?.value === "off") setSoundOn(false);
      } catch (e) { /* default is on */ }
      try {
        const m = await storage.get(MOTION_KEY);
        if (MOTION_LEVELS.includes(m?.value)) setMotionLevel(m.value);
      } catch (e) { /* default is full */ }
      /* The saved theme is deliberately NOT restored here. Every fresh
         launch starts on the Moon/Mars picker, even for returning players. */
      try {
        const r = await storage.get("orbit:stats");
        if (r?.value) setStats(JSON.parse(r.value));
      } catch (e) { /* nothing saved yet */ }
      try {
        const d = await storage.get("orbit:daily");
        if (d?.value && JSON.parse(d.value).date === todayKey()) setDailyDone(true);
      } catch (e) { /* no daily record yet */ }
      try {
        const p = await storage.get("orbit:profile");
        if (p?.value) setProfile({ name: "", handle: "", model: "", ...JSON.parse(p.value) });
      } catch (e) { /* no profile yet */ }
      try {
        const ds = await storage.get("orbit:daystreak");
        if (ds?.value) setDayStreakData({ lastDate: null, current: 0, best: 0, ...JSON.parse(ds.value) });
      } catch (e) { /* no day streak yet */ }
      try {
        const m = await storage.get("orbit:milestone");
        if (m?.value) setStreakMilestone(parseInt(m.value, 10));
      } catch (e) { /* no pending milestone */ }
      try {
        const ev = await storage.get("orbit:escape");
        if (ev?.value) setEscapeBest(parseFloat(ev.value) || 0);
      } catch (e) { /* no escape run yet */ }
      try {
        const ih = await storage.get("orbit:installhint");
        if (ih?.value === "off") setInstallDismissed(true);
      } catch (e) { /* never dismissed */ }
      try {
        const w = await storage.get("orbit:welcomed");
        if (w?.value === "on") setWelcomed(true);
      } catch (e) { /* first time ever, or predates this flag */ }
      try {
        const gb = await storage.get("orbit:geo:best");
        if (gb?.value) setGeoBest(parseInt(gb.value, 10) || 0);
      } catch (e) { /* no road trip yet */ }
      try {
        const go = await storage.get("orbit:geo:optin");
        if (go?.value === "on") setGeoOptIn(true);
      } catch (e) { /* never agreed to share location */ }
      try {
        const sk = await storage.get(SKILL_STORAGE_KEY);
        if (sk?.value) setSkill(parseSkill(JSON.parse(sk.value)));
      } catch (e) { /* first run, or predates Adaptive */ }
      setBooted(true);
    })();
  }, []);

  const pickTheme = async (id) => {
    setThemeId(id);
    SFX.setTheme(id);
    try { await storage.set("orbit:theme", id); } catch (e) { /* not fatal */ }
  };

  const toggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    SFX.setEnabled(next);
    if (next) SFX.ui();  // confirm it came back on
    try { await storage.set("orbit:sound", next ? "on" : "off"); } catch (e) { /* session only */ }
  };

  /* Cycles full -> subtle -> off, and always works — including when the
     device has asked for reduced motion. That preference picks the
     starting point (see lib/motion.js); it does not get to hold the
     control hostage. */
  const cycleMotion = async () => {
    const next = nextMotionLevel(motion.level);
    setMotionLevel(next);
    SFX.ui();
    try { await storage.set(MOTION_KEY, next); } catch (e) { /* session only */ }
  };

  const dismissMilestone = async () => {
    setStreakMilestone(null);
    try { await storage.set("orbit:milestone", ""); } catch (e) { /* not fatal */ }
  };

  const saveProfile = async (next) => {
    setProfile(next);
    try { await storage.set("orbit:profile", JSON.stringify(next)); } catch (e) { /* session only */ }
    setScreen("home");
  };

  const saveStats = async (next) => {
    setStats(next);
    try { await storage.set("orbit:stats", JSON.stringify(next)); } catch (e) { /* session only */ }
  };

  const saveGeoBest = async (pts) => {
    if (!(pts > geoBest)) return;
    setGeoBest(pts);
    try { await storage.set("orbit:geo:best", String(pts)); } catch (e) { /* session only */ }
  };

  const saveGeoOptIn = async () => {
    setGeoOptIn(true);
    try { await storage.set("orbit:geo:optin", "on"); } catch (e) { /* session only */ }
  };

  const saveSkill = async (next) => {
    setSkill(next);
    try { await storage.set(SKILL_STORAGE_KEY, JSON.stringify(next)); } catch (e) { /* session only */ }
  };

  const recordSkill = async (answers) => {
    if (!answers || !answers.length) return;
    await saveSkill(applyAnswers(skill, answers));
  };

  /* Gates the very first appearance: nobody who already has a run on
     this device needs onboarding, even if they somehow never got the
     welcomed flag written (an update landing between their first and
     second session, for instance). replayWelcome bypasses this check
     entirely for the on-demand reopen from the profile screen. */
  const showWelcome = replayWelcome || (!welcomed && stats.runs === 0);

  const closeWelcome = async () => {
    setReplayWelcome(false);
    if (!welcomed) {
      setWelcomed(true);
      try { await storage.set("orbit:welcomed", "on"); } catch (e) { /* not fatal */ }
    }
  };

  /* First Orbit skips the driving check on purpose, same reasoning as
     Crew Mode: nobody's very first launch of an invite link is happening
     mid-drive, and interrupting the welcome moment right after it lands
     would undercut the whole point of it. */
  const startFirstOrbit = () => {
    const who = (profile.name || "").trim() || "You";
    closeWelcome();
    setMode("firstorbit");
    setConfig({
      players: [who],
      timer: 20,
      sameQ: true,
      count: 10,
      pool: QUESTIONS.filter((q) => q.d === "Earthbound"),
      difficulty: "Earthbound",
      cats: [],
    });
    setRunKey((k) => k + 1);
    setScreen("game");
  };

  const afterDrivingCheck = () => {
    const who = (profile.name || "").trim() || "You";
    if (pendingMode === "geotrip") {
      /* Road trip doesn't use the Game component at all, so there is no
         deck to build and no run to key — it just opens its own screen. */
      setScreen("geotrip");
      return;
    }
    if (pendingMode === "daily") {
      setMode("daily");
      setConfig({ players: [who], timer: 20, sameQ: true, count: 10, pool: QUESTIONS, difficulty: "Mixed", cats: [] });
      setRunKey((k) => k + 1);
      setScreen("game");
    } else if (pendingMode === "escape") {
      const deck = buildEscapeDeck();
      setMode("escape");
      setConfig({ players: [who], timer: ESCAPE.timerStart, sameQ: true, count: deck.length, pool: deck, difficulty: "Ladder", cats: [] });
      setRunKey((k) => k + 1);
      setScreen("game");
    }
  };

  /* A fresh Escape run needs a fresh ladder, so "Launch again"
     rebuilds the deck instead of replaying the same order. */
  const relaunchEscape = () => {
    const deck = buildEscapeDeck();
    setConfig((c) => ({ ...c, count: deck.length, pool: deck }));
    setRunKey((k) => k + 1);
    setScreen("game");
  };

  const finish = async (data) => {
    const solo = (data.players || []).length <= 1;
    const shouldRecord =
      mode !== "firstorbit" &&
      (mode === "daily" || mode === "escape" || (mode === "custom" && solo));
    if (shouldRecord) await recordSkill(data.answers);

    if (data.escape) {
      setResults({ ...data, prevBestV: escapeBest });
      setScreen("results");
      if (data.velocity > escapeBest) {
        setEscapeBest(data.velocity);
        try { await storage.set("orbit:escape", String(data.velocity)); } catch (e) { /* session only */ }
      }
      await saveStats({ ...stats, runs: stats.runs + 1 });
      return;
    }
    let nextStreak = dayStreakData;
    if (mode === "daily") nextStreak = bumpDayStreak(dayStreakData);
    setResults({
      ...data,
      prevBest: stats.best,
      mode,
      difficulty: data.difficulty || config?.difficulty,
      dayStreak: mode === "daily" ? nextStreak.current : liveDayStreak(dayStreakData),
    });
    setScreen("results");
    const topScore = Math.max(...data.scores);
    const topStreak = Math.max(...data.bestStreaks);
    await saveStats({
      best: Math.max(stats.best, topScore),
      streak: Math.max(stats.streak, topStreak),
      runs: stats.runs + 1,
    });
    if (mode === "daily") {
      setDailyDone(true);
      try { await storage.set("orbit:daily", JSON.stringify({ date: todayKey(), score: topScore })); } catch (e) { /* not fatal */ }
      if (nextStreak !== dayStreakData) {
        setDayStreakData(nextStreak);
        try { await storage.set("orbit:daystreak", JSON.stringify(nextStreak)); } catch (e) { /* not fatal */ }
        if (nextStreak.current === 7 || nextStreak.current === 30 || nextStreak.current === 100) {
          setStreakMilestone(nextStreak.current);
          try { await storage.set("orbit:milestone", String(nextStreak.current)); } catch (e) { /* not fatal */ }
        }
      }
    }
  };


  if (!booted) {
    return (
      <div style={{ background: "#03040A", minHeight: "100vh" }}>
        <GlobalStyles />
      </div>
    );
  }

  if (!themeId) {
    return (
      <>
        <GlobalStyles />
        <PlanetPicker onPick={pickTheme} />
      </>
    );
  }

  const theme = THEMES[themeId];

  return (
    <ThemeCtx.Provider value={theme}>
      <MotionCtx.Provider value={motion}>
      <GlobalStyles />
      <div style={{ background: theme.void, minHeight: "100vh", transition: "background .4s ease" }}>
        {screen === "home" && showWelcome && (
          <Welcome onStart={startFirstOrbit} onSkip={closeWelcome} />
        )}

        {screen === "home" && !showWelcome && (
          <Home
            onDaily={() => { setPendingMode("daily"); setScreen("driving"); }}
            onCustom={() => setScreen("custom")}
            onEscape={() => { setPendingMode("escape"); setScreen("driving"); }}
            onGeoTrip={() => { setPendingMode("geotrip"); setScreen("driving"); }}
            geoBest={geoBest}
            escapeBest={escapeBest}
            stats={stats}
            dailyDone={dailyDone}
            themeName={theme.name}
            onSwapTheme={() => pickTheme(themeId === "moon" ? "mars" : "moon")}
            profile={profile}
            dayStreak={liveDayStreak(dayStreakData)}
            onOpenProfile={() => setScreen("profile")}
            streakMilestone={streakMilestone}
            onDismissMilestone={dismissMilestone}
            soundOn={soundOn}
            onToggleSound={toggleSound}
            motionLevel={motion.level}
            deviceAsksReduced={motion.systemReduced}
            onCycleMotion={cycleMotion}
            showInstall={showInstall}
            canInstall={canInstall}
            onDismissInstall={dismissInstall}
            androidPrompt={runAndroidInstall}
          />
        )}

        {screen === "profile" && (
          <ProfileScreen
            profile={profile}
            skill={skill}
            onSave={saveProfile}
            onBack={() => setScreen("home")}
            onReplayWelcome={() => { setReplayWelcome(true); setScreen("home"); }}
          />
        )}

        {screen === "driving" && (
          <>
            <Home
              onDaily={() => {}}
              onCustom={() => {}}
              onEscape={() => {}}
              onGeoTrip={() => {}}
              geoBest={geoBest}
              escapeBest={escapeBest}
              stats={stats}
              dailyDone={dailyDone}
              themeName={theme.name}
              onSwapTheme={() => {}}
              profile={profile}
              dayStreak={liveDayStreak(dayStreakData)}
              onOpenProfile={() => {}}
              streakMilestone={null}
              onDismissMilestone={() => {}}
              soundOn={soundOn}
              onToggleSound={() => {}}
              motionLevel={motion.level}
              deviceAsksReduced={motion.systemReduced}
              onCycleMotion={() => {}}
              showInstall={false}
              canInstall={false}
              onDismissInstall={() => {}}
              androidPrompt={null}
            />
            <DrivingCheck onConfirm={afterDrivingCheck} onCancel={() => setScreen("home")} />
          </>
        )}

        {screen === "custom" && (
          <CustomSetup
            skill={skill}
            onBack={() => setScreen("home")}
            onStart={(cfg) => { setMode("custom"); setConfig({ ...cfg, skill }); setRunKey((k) => k + 1); setScreen("game"); }}
          />
        )}

        {screen === "geotrip" && (
          <RoadTripScreen
            onHome={() => setScreen("home")}
            optedIn={geoOptIn}
            onOptIn={saveGeoOptIn}
            onTripEnd={saveGeoBest}
            geoBest={geoBest}
          />
        )}

        {screen === "game" && config && (
          <Game key={runKey} config={config} mode={mode} onFinish={finish} onQuit={() => setScreen("home")} />
        )}

        {screen === "results" && results && (
          results.escape ? (
            <EscapeResults
              data={results}
              profile={profile}
              prevBest={results.prevBestV}
              onHome={() => setScreen("home")}
              onAgain={relaunchEscape}
            />
          ) : (
            <Results
              data={results}
              profile={profile}
              onHome={() => setScreen("home")}
              onAgain={() => { setRunKey((k) => k + 1); setScreen("game"); }}
            />
          )
        )}
      </div>
      </MotionCtx.Provider>
    </ThemeCtx.Provider>
  );
}
