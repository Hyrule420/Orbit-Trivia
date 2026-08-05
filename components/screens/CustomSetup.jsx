"use client";

import React, { useState } from "react";
import { X, Play } from "lucide-react";
import { useC } from "../../lib/theme";
import { QUESTIONS, TIER_META, CATEGORIES } from "../../lib/questions";
import Starfield from "../art/Starfield";
import Section from "../ui/Section";
import Slider from "../ui/Slider";
import Btn from "../ui/Btn";

export default function CustomSetup({ onStart, onBack }) {
  const C = useC();
  const [players, setPlayers] = useState(["Player 1", "Player 2"]);
  const [difficulty, setDifficulty] = useState("Mixed");
  const [cats, setCats] = useState([]);
  const [count, setCount] = useState(10);
  const [timer, setTimer] = useState(15);
  const [sameQ, setSameQ] = useState(false);

  const toggleCat = (c) => setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const addPlayer = () => players.length < 8 && setPlayers([...players, `Player ${players.length + 1}`]);
  const rmPlayer = (i) => players.length > 1 && setPlayers(players.filter((_, x) => x !== i));
  const setName = (i, v) => setPlayers(players.map((p, x) => (x === i ? v : p)));

  const pool = QUESTIONS.filter((q) => (difficulty === "Mixed" || q.d === difficulty) && (cats.length === 0 || cats.includes(q.c)));
  const enough = pool.length >= count;

  return (
    <div className="relative min-h-screen p-6" style={{ background: C.void }}>
      <Starfield />
      <div className="relative z-10 max-w-md mx-auto pb-8">
        <div className="flex items-center justify-between mb-6 pt-2">
          <h1 style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 24, color: C.star }}>Set up the run</h1>
          <button onClick={onBack} className="active:scale-90" style={{ transition: "transform .12s" }}>
            <X size={22} style={{ color: C.dim }} />
          </button>
        </div>

        <Section label="WHO'S PLAYING">
          <div className="flex flex-col gap-2">
            {players.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={p}
                  onChange={(e) => setName(i, e.target.value)}
                  maxLength={14}
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: C.hullLight, border: `1px solid ${C.edge}`, color: C.star, fontFamily: "'Chakra Petch', sans-serif" }}
                />
                {players.length > 1 && (
                  <button onClick={() => rmPlayer(i)} className="p-2 active:scale-90">
                    <X size={16} style={{ color: C.dim }} />
                  </button>
                )}
              </div>
            ))}
            {players.length < 8 && <Btn variant="ghost" onClick={addPlayer} full>+ Add player</Btn>}
          </div>
        </Section>

        <Section label="DIFFICULTY">
          <div className="grid grid-cols-2 gap-2">
            {["Mixed", "Earthbound", "Orbit", "Martian"].map((t) => {
              const on = difficulty === t;
              const col = TIER_META[t] ? C[TIER_META[t].key] : C.star;
              return (
                <button
                  key={t}
                  onClick={() => setDifficulty(t)}
                  className="px-3 py-3 rounded-xl text-left active:scale-95"
                  style={{ background: on ? `${col}18` : C.hullLight, border: `1px solid ${on ? col : C.edge}`, transition: "all .18s" }}
                >
                  <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, fontSize: 14, color: on ? col : C.star }}>{t}</div>
                  {TIER_META[t] && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, marginTop: 2 }}>
                      {TIER_META[t].points} PTS
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        <Section label={`CATEGORIES ${cats.length === 0 ? "· ALL" : `· ${cats.length}`}`}>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const on = cats.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className="px-3 py-2 rounded-full text-xs active:scale-95"
                  style={{
                    background: on ? `${C.plasma}22` : C.hullLight,
                    border: `1px solid ${on ? C.plasma : C.edge}`,
                    color: on ? C.plasma : C.dim,
                    fontFamily: "'Chakra Petch', sans-serif",
                    fontWeight: 600,
                    transition: "all .18s",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Section>

        <Section label="QUESTIONS PER PLAYER">
          <Slider value={count} min={5} max={20} step={5} onChange={setCount} suffix="" />
        </Section>

        <Section label="SECONDS PER TURN">
          <Slider value={timer} min={5} max={45} step={5} onChange={setTimer} suffix="s" />
        </Section>

        <Section label="QUESTION SET">
          <button
            onClick={() => setSameQ(!sameQ)}
            className="w-full p-4 rounded-xl text-left active:scale-95"
            style={{ background: C.hullLight, border: `1px solid ${sameQ ? C.ion : C.edge}`, transition: "all .18s" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600, fontSize: 14, color: C.star }}>
                  {sameQ ? "Everyone gets the same questions" : "Everyone gets different questions"}
                </div>
                <div className="text-xs mt-1" style={{ color: C.dim }}>
                  {sameQ ? "Head to head. Same test, no excuses." : "Fresh questions each turn. Nobody overhears an answer."}
                </div>
              </div>
              <div
                className="rounded-full flex-shrink-0"
                style={{ width: 44, height: 26, background: sameQ ? C.ion : C.edge, padding: 3, transition: "background .2s" }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: 20,
                    height: 20,
                    background: C.void,
                    transform: sameQ ? "translateX(18px)" : "translateX(0)",
                    transition: "transform .2s cubic-bezier(.2,.8,.2,1)",
                  }}
                />
              </div>
            </div>
          </button>
        </Section>

        {!enough && (
          <div className="p-3 rounded-xl mb-4 text-xs" style={{ background: `${C.abort}18`, border: `1px solid ${C.abort}55`, color: C.abort }}>
            Only {pool.length} questions match those filters. Widen the categories or difficulty, or drop the question count.
          </div>
        )}

        <Btn full disabled={!enough} onClick={() => onStart({ players, difficulty, cats, count, timer, sameQ, pool })} style={{ padding: "16px", fontSize: 16 }}>
          <span className="flex items-center justify-center gap-2"><Play size={18} /> Launch</span>
        </Btn>
      </div>
    </div>
  );
}
