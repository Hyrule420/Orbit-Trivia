/* ============================================================
   PERSISTENCE
   The prototype ran inside a preview that provided window.storage.
   The deployed app has no such thing, so we back the same API with
   the browser's own localStorage. Wrapped in a guard because this
   module is also evaluated on the server, where window is undefined.

   The global is still installed, rather than replaced outright by the
   named export below, because components/roadtrip/RoadTripScreen.jsx
   reads window.storage directly. Installing it here rather than inside
   a component means it no longer matters who renders first.

   get() throws when a key has never been written. Callers rely on that
   and catch it to mean "nothing saved yet" — don't soften it to null.
   ============================================================ */
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (key) => {
      const value = window.localStorage.getItem(key);
      if (value === null) throw new Error(`No stored value for ${key}`);
      return { key, value };
    },
    set: async (key, value) => {
      window.localStorage.setItem(key, String(value));
      return { key, value };
    },
  };
}

/* Importing this binding is what pulls the shim above into the bundle.
   A bare `import "@/lib/storage"` would work today, but it reads like a
   stray line and the next tidy-up would delete it. */
export const storage = {
  get: (key) => window.storage.get(key),
  set: (key, value) => window.storage.set(key, value),
};
