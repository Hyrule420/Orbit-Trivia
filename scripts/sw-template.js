/* ============================================================
   THE OFFLINE SHELL WORKER.

   This file is a template -- scripts/postbuild-sw.mjs fills in
   CACHE_VERSION and PRECACHE_URLS after every next build and writes
   the result to public/sw.js, which is what actually gets served and
   registered. Editing public/sw.js directly is a dead end: the next
   build overwrites it. Edit this file instead.

   Two caches, two lifetimes:
     orbit-shell-<version>   the app itself -- every JS/CSS chunk plus
                              the page shell, wiped and rebuilt whole
                              on every deploy, old versions deleted on
                              activate so nobody is ever left running
                              half of two different builds at once.
     orbit-fonts-v1          the Google Fonts CDN responses, kept
                              forever across deploys -- fonts do not
                              change when the app does, and there is
                              no reason to make a driver re-download
                              them after every push.

   Registered production-only (see ServiceWorkerRegistration.jsx), so
   none of this runs, or needs to run, under next dev.
   ============================================================ */

const CACHE_VERSION = "__CACHE_VERSION__";
const SHELL_CACHE = `orbit-shell-${CACHE_VERSION}`;
const FONT_CACHE = "orbit-fonts-v1";
const PRECACHE_URLS = __PRECACHE_URLS__;

/* How long a page load waits on the network before giving up and
   opening from cache instead. Long enough to win on any real
   connection, short enough that a dead zone on US-19 still opens the
   app more or less instantly. */
const NAV_TIMEOUT_MS = 3000;

self.addEventListener("install", (event) => {
  /* Not cache.addAll -- that rejects the entire precache if even one
     of several hundred chunk URLs 404s or times out. Fetching each
     one independently means a single bad URL is just a missing tile
     in the shell, not a worker that never installs. */
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) =>
          fetch(url)
            .then((response) => {
              if (response.ok) return cache.put(url, response);
            })
            .catch(() => {})
        )
      )
    )
  );
  /* Take over immediately rather than waiting for every open tab to
     close -- a road trip is one long-lived tab, and the outgoing
     worker would otherwise keep serving a stale shell for the whole
     rest of the drive. */
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("orbit-shell-") && key !== SHELL_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

const isFontHost = (hostname) =>
  hostname === "fonts.googleapis.com" || hostname === "fonts.gstatic.com";

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  /* Fonts: answer from cache instantly if there is one, and refresh
     it in the background -- stale-while-revalidate. A driver never
     waits on a font fetch, and the cache still catches up once
     signal returns. */
  if (isFontHost(url.hostname)) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const network = fetch(event.request)
          .then((response) => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  /* Anything else off-origin (Vercel analytics, speed insights) is
     not this worker's business -- straight to the network, and if it
     fails, it fails silently the same way it already does today. */
  if (url.origin !== self.location.origin) return;

  /* The page itself: network first. This is the one request that must
     not come from cache by default -- the HTML names which hashed JS
     chunks to load, so serving yesterday's copy pins the whole app to
     yesterday's build no matter how many new ones have shipped. That
     is invisible in a browser tab, where a pull-to-refresh papers over
     it, and permanent in a home-screen app, where there is no refresh
     gesture at all and every launch is this exact request.

     Fresh HTML names the new chunks, which miss the shell cache and
     come straight off the network, so a new deploy is live on the
     first launch after it lands rather than the second. Offline, the
     fetch fails or times out and the cached shell answers exactly as
     it did before. */
  if (event.request.mode === "navigate") {
    event.respondWith(
      Promise.race([
        fetch(event.request),
        new Promise((_, reject) => setTimeout(reject, NAV_TIMEOUT_MS)),
      ])
        .then((response) => {
          /* Refresh the offline copy on the way past, but only from a
             response worth keeping -- caching a 500 from a half-broken
             deploy would strand the app there until the next one. */
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.put("/", copy)));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((hit) => hit || caches.match("/")))
    );
    return;
  }

  /* Everything else -- hashed chunks, icons, fonts already handled
     above -- stays cache first. Those URLs contain a content hash, so
     a cached one can never be stale: a changed file is a different
     URL, and the new HTML asks for it by name. */
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match("/"));
    })
  );
});
