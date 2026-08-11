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

  /* The app shell: cache first, network as a fallback for anything
     not precached, and the cached page shell as a last resort for a
     navigation with no connection and no direct match. */
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match("/"));
    })
  );
});
