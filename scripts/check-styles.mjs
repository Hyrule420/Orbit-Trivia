#!/usr/bin/env node
/* ============================================================
   Guard against the hydration bug this codebase keeps re-inventing.

   React escapes " ' < and > when it serialises text content. A <style>
   element is a raw-text element, so the browser never decodes those
   entities back. Put any of those four characters inside a rendered
   <style>{`...`}</style> — even in a CSS comment — and two things
   happen at once: the CSS arrives corrupted, and the server markup no
   longer matches what the client renders, so hydration fails and React
   throws the whole tree away.

   It has happened three times now (an apostrophe in prose, quoted
   attribute selectors, and a literal <html> in a comment), each time
   costing a debugging session, because the symptom is "the app is
   broken" with no obvious link to a comment nobody thought was code.

   Only components that render on the server can actually break, but
   this checks every one of them: a file that is client-only today can
   be imported somewhere server-rendered tomorrow, and the fix is free
   anyway (say "the root element", drop the quotes).

   Usage: node scripts/check-styles.mjs
   ============================================================ */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const FORBIDDEN = /["'<>]/;
const NAMES = { '"': "double quote", "'": "apostrophe", "<": "less-than", ">": "greater-than" };

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
  }
  return out;
}

const problems = [];

for (const file of walk(ROOT)) {
  const src = readFileSync(file, "utf8");
  /* Match <style>{`  ...  `}</style>, the only shape this app uses. */
  const blocks = src.matchAll(/<style>\{`([\s\S]*?)`\}<\/style>/g);

  for (const block of blocks) {
    const body = block[1];
    /* ${...} is JavaScript, not CSS text — React evaluates it before
       escaping, so quotes inside an interpolation are the author's
       problem, not ours. Blank them out so they can't false-positive. */
    const css = body.replace(/\$\{[^}]*\}/g, (m) => " ".repeat(m.length));
    const startLine = src.slice(0, block.index).split("\n").length;

    css.split("\n").forEach((line, i) => {
      if (!FORBIDDEN.test(line)) return;
      const found = [...new Set(line.match(/["'<>]/g))].map((c) => NAMES[c]).join(", ");
      problems.push(
        `${relative(ROOT, file)}:${startLine + i}  contains ${found}\n` +
        `    ${line.trim().slice(0, 100)}`
      );
    });
  }
}

if (problems.length) {
  console.error(
    `\nFound ${problems.length} forbidden character(s) inside rendered <style> blocks.\n` +
    `React escapes \" ' < and > in text, and <style> is raw text, so these corrupt the CSS\n` +
    `and break hydration. Rewrite the line without them — see the header of\n` +
    `components/GlobalStyles.jsx.\n\n` +
    problems.join("\n\n") + "\n"
  );
  process.exit(1);
}

console.log("check:styles — no forbidden characters in any rendered <style> block");
