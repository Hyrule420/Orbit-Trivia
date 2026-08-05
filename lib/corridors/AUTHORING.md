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
- **Zone circles must never overlap.** Two zones need to be further apart than the sum
  of their radii, or a stretch of road has both live at once and fires two questions
  back to back. On open highway that means roughly 4 km apart at 2500 m radii.
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
drifted off the road, overlapping circles, duplicate ids and answers that aren't among
their four options.

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
};
```

`bounds` is both the map framing and a sanity check — a zone outside the box is almost
certainly a transposed coordinate. **Widen it whenever you extend the route.**

Add the corridor to the list in `index.js` and it appears in the picker.
