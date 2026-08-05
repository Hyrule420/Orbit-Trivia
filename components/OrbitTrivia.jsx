"use client";

import React, { useState, useEffect } from "react";
import GlobalStyles from "@/components/GlobalStyles";
import { THEMES, ThemeCtx } from "@/lib/theme";
import { QUESTIONS } from "@/lib/questions";
import { SFX } from "@/lib/sfx";
import { storage } from "@/lib/storage";
import { todayKey, liveDayStreak, bumpDayStreak } from "@/lib/day";
import { ESCAPE, buildEscapeDeck } from "@/lib/escape";
import { isInstalled, isIOSSafari } from "@/lib/platform";
import DrivingCheck from "@/components/ui/DrivingCheck";
import PlanetPicker from "@/components/screens/PlanetPicker";
import ProfileScreen from "@/components/screens/ProfileScreen";
import CustomSetup from "@/components/screens/CustomSetup";
import Results from "@/components/screens/Results";
import EscapeResults from "@/components/screens/EscapeResults";
import Game from "@/components/Game";
import Home from "@/components/home/Home";


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
  const [escapeBest, setEscapeBest] = useState(0);
  const [installDismissed, setInstallDismissed] = useState(false);
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

  /* The hint waits until someone has finished a run. Asking a
     first-time visitor to install something they haven't played
     yet is how you get it dismissed forever. */
  const showInstall =
    !installDismissed && !isInstalled() && stats.runs >= 1 && (androidEvt !== null || isIOSSafari());

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

  useEffect(() => { SFX.setEnabled(soundOn); }, [soundOn]);
  useEffect(() => { if (themeId) SFX.setTheme(themeId); }, [themeId]);

  useEffect(() => {
    (async () => {
      try {
        const s = await storage.get("orbit:sound");
        if (s?.value === "off") setSoundOn(false);
      } catch (e) { /* default is on */ }
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

  const afterDrivingCheck = () => {
    const who = (profile.name || "").trim() || "You";
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
    } else {
      setScreen("custom");
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
    setResults({ ...data, prevBest: stats.best });
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
      const nextStreak = bumpDayStreak(dayStreakData);
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
      <GlobalStyles />
      <div style={{ background: theme.void, minHeight: "100vh", transition: "background .4s ease" }}>
        {screen === "home" && (
          <Home
            onDaily={() => { setPendingMode("daily"); setScreen("driving"); }}
            onCustom={() => { setPendingMode("custom"); setScreen("driving"); }}
            onEscape={() => { setPendingMode("escape"); setScreen("driving"); }}
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
            showInstall={showInstall}
            onDismissInstall={dismissInstall}
            androidPrompt={runAndroidInstall}
          />
        )}

        {screen === "profile" && (
          <ProfileScreen profile={profile} onSave={saveProfile} onBack={() => setScreen("home")} />
        )}

        {screen === "driving" && (
          <>
            <Home
              onDaily={() => {}}
              onCustom={() => {}}
              onEscape={() => {}}
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
              showInstall={false}
              onDismissInstall={() => {}}
              androidPrompt={null}
            />
            <DrivingCheck onConfirm={afterDrivingCheck} onCancel={() => setScreen("home")} />
          </>
        )}

        {screen === "custom" && (
          <CustomSetup
            onBack={() => setScreen("home")}
            onStart={(cfg) => { setMode("custom"); setConfig(cfg); setRunKey((k) => k + 1); setScreen("game"); }}
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
    </ThemeCtx.Provider>
  );
}
