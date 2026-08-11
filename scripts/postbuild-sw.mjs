#!/usr/bin/env node
/* ============================================================
   Fills in scripts/sw-template.js with this build's version and
   asset list, and writes the result to public/sw.js -- the file
   that actually gets served and registered.

   Runs after next build (see the build script in package.json). The
   app is a normal Next.js server build, not a static export, so
   there is no single output directory to just copy from; the two
   things that change per build are read straight from Next's own
   build artifacts:

     .next/BUILD_ID   a fresh id every build -- used as the cache
                      version, so activate() in the worker can tell a
                      new deploy from the last one and drop the old
                      cache instead of leaving it to rot.
     .next/static/    every hashed JS/CSS/media chunk this build
                      produced, served back out at /_next/static/.

   public/ itself (icons, manifest.json) is walked too, and "/" is
   added by hand so the page shell itself gets cached on install.
   ============================================================ */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function walk(dir) {
  let out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(full));
    else out.push(full);
  }
  return out;
}

const toRootUrl = (base, file) => "/" + path.relative(base, file).split(path.sep).join("/");

const buildId = readFileSync(path.join(ROOT, ".next", "BUILD_ID"), "utf8").trim();

const nextStaticDir = path.join(ROOT, ".next", "static");
const nextStaticUrls = walk(nextStaticDir).map((f) => "/_next/static" + toRootUrl(nextStaticDir, f));

const publicDir = path.join(ROOT, "public");
const publicUrls = walk(publicDir)
  .map((f) => toRootUrl(publicDir, f))
  .filter((u) => u !== "/sw.js");

const precacheUrls = ["/", ...publicUrls, ...nextStaticUrls];

const template = readFileSync(path.join(ROOT, "scripts", "sw-template.js"), "utf8");
const output = template
  .replace("__CACHE_VERSION__", buildId)
  .replace("__PRECACHE_URLS__", JSON.stringify(precacheUrls));

writeFileSync(path.join(publicDir, "sw.js"), output);

console.log(`sw.js generated -- ${precacheUrls.length} precached URLs, version ${buildId}`);
