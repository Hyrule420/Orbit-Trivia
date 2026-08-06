# Adding places to a road trip corridor

This is the content system for Road Trip mode. Everything the game knows about the
world lives in this folder — one file per corridor, plus `index.js` which lists them.

There is no database, no API key and nothing to deploy. Edit a file, save, done.

## How to add a place

1. Open Google Maps and find the spot **on the road** nearest the landmark — not the
   landmark itself. Right-click the road and Google copies the two numbers
   (latitude, longitude) for you.
2. Paste them in as `lat` and `lng`.
3. Write the question. Copy the shape of any existing entry.
4. Save.

## The rules

Breaking these is how a zone silently never fires. Nothing errors — the question just
never appears, which is very hard to notice.

- **Put the pin on the road, not on the landmark.** If you centre a zone on a building
  three miles off the highway, its circle never touches the road and the question can
  never trigger. The `blurb` is where you say "off to your west…" — the pin's only job
  is to catch the car as it passes.
- **`radiusM` between 1500 and 3000.** At 60 mph a 2500 m circle gives you about three
  minutes inside the zone. In town, where traffic runs at 45 mph and landmarks sit
  closer together, use 1500–2000.
- **Zones must not sit on the same spot** — closer than 600 m apart and it's almost
  always the same landmark entered twice, or a copy-pasted coordinate somebody forgot
  to edit. Overlapping *trigger circles* are fine and deliberately allowed: queueing
  happens before anything is displayed, so driving into two at once queues both and
  downgrades one to a toast. Requiring non-overlapping circles meant throwing away real
  landmarks for being near each other, which around Kennedy is most of them.
- **Pacing matters more than count.** Zones clustered in the towns with nothing between
  them is worse than fewer, evenly spread. When adding several at once, space them by
  distance along the route rather than by eye.
- **`d` must be exactly `"Earthbound"`, `"Orbit"` or `"Martian"`** — that decides points
  and colour.
- **`o` must have exactly four options, and `a` must be one of them**, spelled
  identically.
- **`id` must be unique and must never be reused or renamed.** Saved progress is stored
  against it: rename an id and everyone who answered that place gets asked again. This
  is why a place squeezed between two existing ones gets a letter rather than a new
  number — inserting `nc-02a` between `nc-02` and `nc-03` keeps the list in geographic
  order without renumbering anything people have already played.

Most of this is checked automatically. Run the app in development and watch the browser
console — `checkPack` in `lib/geo.js` reports mistyped coordinates, zones that have
drifted off the road, two zones on the same spot, duplicate ids and answers that aren't
among their four options.

## Optional flavour fields

Three optional fields change how an arrival *feels*. Leave them off and the place gets
the plain treatment, which is the right default for most entries.

- **`kind`** — what sort of place this is: `"pad"`, `"water"` or `"wildlife"`. Drives the
  arrival card's entrance animation and its overlays (`components/roadtrip/ArrivalPopup.jsx`).
  `"pad"` additionally lets the arrival skip the burst throttle, so a cluster of launch
  complexes doesn't mute the arrivals people came for.
- **`fx`** — opts the zone into a full-screen sequence on arrival: `"launch"` for an
  ignition and climb-out, `"landing"` for a booster coming home. Use it only where that
  literally happens. The Vehicle Assembly Building and the Crawlerway are both
  `kind: "pad"` and deliberately have **no** `fx` — nothing lifts off from either, so a
  rocket climbing out of them would read as a bug.
- **`vehicle`** — which silhouette the sequence flies: `"starship"` or `"falcon"`.
  Defaults to `"falcon"`.

The sequence is skipped entirely when the player's motion setting is Off or their device
asks for reduced motion, so nothing here may be load-bearing for the question itself.

## The shape of a corridor

```js
export const someCorridor = {
  id: "space-coast",            // stable; progress is namespaced by it
  name: "Space Coast",
  road: "US-1 & A1A",
  tagline: "One line for the picker card.",
  bounds: [[southLat, westLng], [northLat, eastLng]],
  route: [ [lat, lng], ... ],   // the road, as a polyline
  zones: [ { id, place, lat, lng, radiusM, blurb, q, o, a, d, c }, ... ],
                                // plus the optional kind / fx / vehicle above
};
```

`bounds` is both the map framing and a sanity check — a zone outside the box is almost
certainly a transposed coordinate. **Widen it whenever you extend the route.**

Add the corridor to the list in `index.js` and it appears in the picker.
