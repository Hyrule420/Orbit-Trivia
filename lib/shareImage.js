import { SITE, STAGES } from "./share.js";
import { TIER_META } from "./questions.js";

/* ============================================================
   PNG FLIGHT CARD
   Drawn on a canvas so the iOS share sheet can send a picture,
   not just a sentence. Layout mirrors FlightCard: HUD corners,
   Earth → Mars arc, beads, score, same-ten kicker.
   ============================================================ */

const W = 1080;
const H = 1350;

function qPoint(t, P0, P1, P2) {
  const u = 1 - t;
  return {
    x: u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x,
    y: u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y,
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hudCorner(ctx, x, y, dx, dy, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + dx * 36, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + dy * 36);
  ctx.stroke();
}

async function waitFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load('700 72px "Chakra Petch"'),
      document.fonts.load('700 22px "JetBrains Mono"'),
      document.fonts.ready,
    ]);
  } catch (e) { /* system fonts will do */ }
}

export async function renderFlightPng(report, C) {
  if (typeof document === "undefined") return null;
  await waitFonts();
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = C.void;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 80; i++) {
    const x = ((i * 97) % 107) / 107 * W;
    const y = ((i * 53) % 131) / 131 * H;
    ctx.fillStyle = C.star;
    ctx.globalAlpha = 0.12 + ((i * 13) % 40) / 220;
    ctx.beginPath();
    ctx.arc(x, y, 1 + (i % 3) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const pad = 56;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 36);
  ctx.fillStyle = C.hull;
  ctx.fill();
  ctx.strokeStyle = report.perfect ? C.ion : C.edge;
  ctx.lineWidth = 2;
  ctx.stroke();

  const x0 = pad + 28;
  const y0 = pad + 28;
  const x1 = W - pad - 28;
  const y1 = H - pad - 28;
  hudCorner(ctx, x0, y0, 1, 1, C.ion);
  hudCorner(ctx, x1, y0, -1, 1, C.ion);
  hudCorner(ctx, x0, y1, 1, -1, C.ion);
  hudCorner(ctx, x1, y1, -1, -1, C.ion);

  ctx.fillStyle = C.ion;
  ctx.font = '500 22px "JetBrains Mono", monospace';
  ctx.letterSpacing = "6px";
  ctx.fillText("FLIGHT REPORT", pad + 64, pad + 88);

  ctx.fillStyle = C.star;
  ctx.font = '700 56px "Chakra Petch", sans-serif';
  ctx.letterSpacing = "2px";
  ctx.fillText(report.headline, pad + 64, pad + 152);

  ctx.fillStyle = C.dim;
  ctx.font = '400 22px "JetBrains Mono", monospace';
  ctx.letterSpacing = "1px";
  ctx.fillText(report.dateLabel, pad + 64, pad + 190);

  ctx.fillStyle = C.star;
  ctx.font = '700 24px "JetBrains Mono", monospace';
  ctx.textAlign = "right";
  ctx.fillText(report.id, W - pad - 64, pad + 108);
  if (report.perfect) {
    ctx.fillStyle = C.ion;
    ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.fillText("FLAWLESS", W - pad - 64, pad + 142);
  }
  ctx.textAlign = "left";

  const P0 = { x: pad + 110, y: 560 };
  const P1 = { x: W / 2, y: 250 };
  const P2 = { x: W - pad - 110, y: 340 };

  ctx.beginPath();
  ctx.moveTo(P0.x, P0.y);
  ctx.quadraticCurveTo(P1.x, P1.y, P2.x, P2.y);
  ctx.strokeStyle = C.edge;
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.stroke();

  const grad = ctx.createLinearGradient(P0.x, P0.y, P2.x, P2.y);
  grad.addColorStop(0, C.ion);
  grad.addColorStop(0.55, C.plasma);
  grad.addColorStop(1, C.abort);
  ctx.beginPath();
  ctx.moveTo(P0.x, P0.y);
  ctx.quadraticCurveTo(P1.x, P1.y, P2.x, P2.y);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 3;
  ctx.stroke();

  const orbs = [
    { p: P0, col: C.ion, r: 16 },
    { p: P2, col: C.abort, r: 18 },
  ];
  for (const o of orbs) {
    ctx.beginPath();
    ctx.arc(o.p.x, o.p.y, o.r, 0, Math.PI * 2);
    ctx.fillStyle = o.col;
    ctx.globalAlpha = 0.95;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(o.p.x, o.p.y, o.r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = C.void;
    ctx.fill();
  }

  const answers = report.answers || [];
  const n = Math.max(answers.length, 1);
  answers.forEach((a, i) => {
    const t = 0.1 + (i / Math.max(n - 1, 1)) * 0.8;
    const p = qPoint(t, P0, P1, P2);
    const col = C[TIER_META[a.d]?.key] || C.star;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
    if (a.ok) {
      ctx.fillStyle = col;
      ctx.fill();
    } else {
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  });

  ctx.textAlign = "center";
  const groups = STAGES.map((s) => {
    const got = answers.filter((x) => x.d === s.d);
    return { ...s, got, hits: got.filter((x) => x.ok).length, col: C[TIER_META[s.d]?.key] || C.dim };
  }).filter((g) => g.got.length);
  groups.forEach((g, i) => {
    const x = pad + 160 + i * ((W - pad * 2 - 320) / Math.max(groups.length - 1, 1));
    ctx.fillStyle = g.col;
    ctx.font = '500 18px "JetBrains Mono", monospace';
    ctx.fillText(g.name, x, 620);
    ctx.fillStyle = C.star;
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText(`${g.hits}/${g.got.length}`, x, 652);
  });

  ctx.fillStyle = C.star;
  ctx.font = '700 120px "Chakra Petch", sans-serif';
  ctx.fillText(Number(report.score || 0).toLocaleString("en-US"), W / 2, 860);
  ctx.fillStyle = C.dim;
  ctx.font = '500 24px "JetBrains Mono", monospace';
  ctx.fillText("PTS", W / 2, 900);

  ctx.fillStyle = C.ion;
  ctx.font = '700 28px "JetBrains Mono", monospace';
  const line = `${report.correct}/${report.total}` + (report.daily && report.streak > 0 ? `   DAY ${report.streak}` : "");
  ctx.fillText(line, W / 2, 960);

  if (report.daily) {
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad + 80, H - pad - 110);
    ctx.lineTo(W - pad - 80, H - pad - 110);
    ctx.stroke();
    ctx.fillStyle = C.dim;
    ctx.font = '500 20px "JetBrains Mono", monospace';
    ctx.fillText("SAME TEN AS EVERYONE ON EARTH", W / 2, H - pad - 64);
  } else {
    ctx.fillStyle = C.dim;
    ctx.font = '400 20px "JetBrains Mono", monospace';
    ctx.fillText(SITE.replace("https://", ""), W / 2, H - pad - 64);
  }

  ctx.textAlign = "left";

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null);
      resolve(new File([blob], `orbit-trivia-${report.id}.png`, { type: "image/png" }));
    }, "image/png");
  });
}
