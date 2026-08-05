/* ============================================================
   GEO — the maths behind "have we arrived somewhere?"

   Nothing in this file knows about React. It is plain functions, so
   you can test any of it from a terminal with `node -e`.
   ============================================================ */

/* How far apart are two points, in metres?

   This is the "equirectangular approximation": pretend a small patch of
   the Earth is flat, and use ordinary Pythagoras on it. The famous
   haversine formula is more correct, but over the distances we care
   about here (0-10 km, in Florida) the two disagree by less than one
   metre. GPS itself is only accurate to 5-20 m and our zones are about
   2,500 m across, so that difference could never change a decision.

   Please don't "fix" this to haversine — it would be slower, harder to
   read, and identical in every case this app will ever see. (It would
   matter near the poles or across the international date line. Florida
   is neither.) */
const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LNG_AT_EQUATOR = 111320;

export function distanceM(aLat, aLng, bLat, bLng) {
  const midLat = ((aLat + bLat) / 2) * (Math.PI / 180);
  const dy = (bLat - aLat) * M_PER_DEG_LAT;
  const dx = (bLng - aLng) * M_PER_DEG_LNG_AT_EQUATOR * Math.cos(midLat);
  return Math.sqrt(dx * dx + dy * dy);
}

/* Compass bearing from one point to another, in degrees (0 = north).
   Used to point the little car arrow the right way on the map. */
export function bearingDeg(aLat, aLng, bLat, bLng) {
  const midLat = ((aLat + bLat) / 2) * (Math.PI / 180);
  const dy = (bLat - aLat) * M_PER_DEG_LAT;
  const dx = (bLng - aLng) * M_PER_DEG_LNG_AT_EQUATOR * Math.cos(midLat);
  const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/* Move from a point a given distance towards another point.
   This is how the simulated drive walks along the route. */
export function moveTowards(aLat, aLng, bLat, bLng, metres) {
  const total = distanceM(aLat, aLng, bLat, bLng);
  if (total <= metres || total === 0) return { lat: bLat, lng: bLng, overshoot: metres - total };
  const f = metres / total;
  return { lat: aLat + (bLat - aLat) * f, lng: aLng + (bLng - aLng) * f, overshoot: 0 };
}

/* ============================================================
   ZONE ENTER / EXIT — with hysteresis

   The naive version of this is `if (distance < radius) fire!`. That
   breaks badly in the real world: a GPS fix wobbles by several metres
   every second, so a car sitting near the edge of a zone flickers
   in/out/in/out and fires the same question over and over.

   The fix is two different thresholds:
     - you are IN once you get within the radius
     - you are OUT only once you get 35% further out than the radius

   So for a 2,000 m zone you enter at 2,000 m but don't leave until
   2,700 m. Normal GPS wobble can't cross that gap, so each zone fires
   exactly once per visit.
   ============================================================ */
export const EXIT_FACTOR = 1.35;

/* Fixes worse than this are thrown away. Under an overpass or between
   tall buildings a phone will happily report "you are here, give or
   take half a kilometre" — which is useless for a 2.5 km zone. */
export const MAX_ACCURACY_M = 200;

/* Don't recompute unless we've actually gone somewhere, or enough time
   has passed. Stops a parked car re-checking every zone every second. */
export const MIN_MOVE_M = 25;
export const MIN_ELAPSED_MS = 4000;

/* Closer than this and two zones are almost certainly the same landmark
   listed twice, rather than two things worth stopping for. */
export const SAME_PLACE_M = 600;

/* Work out which zones we just entered.

   `insideIds` is a Set that this function MUTATES — the caller keeps it
   in a ref so it survives re-renders. `skipIds` is the set of zones we
   never want to hear about again (already queued, answered or skipped);
   those still update insideIds so the in/out tracking stays honest, but
   they don't get reported.

   Returns { entered: [zone], nearest: { zone, distanceM } | null } */
export function sweepZones(lat, lng, zones, insideIds, skipIds) {
  const entered = [];
  let nearest = null;

  for (const zone of zones) {
    const d = distanceM(lat, lng, zone.lat, zone.lng);

    if (!nearest || d < nearest.distanceM) nearest = { zone, distanceM: d };

    const wasInside = insideIds.has(zone.id);

    if (!wasInside && d <= zone.radiusM) {
      insideIds.add(zone.id);
      if (!skipIds || !skipIds.has(zone.id)) entered.push(zone);
    } else if (wasInside && d > zone.radiusM * EXIT_FACTOR) {
      insideIds.delete(zone.id);
    }
    /* Anything in between: no change. That gap is the hysteresis. */
  }

  return { entered, nearest };
}

/* ============================================================
   ROUTE HELPERS
   ============================================================ */

/* Shortest distance from a point to a line segment, in metres.
   Used to check that zones actually sit near the highway, and to snap
   the simulator onto the route when you click somewhere on the map. */
function distanceToSegmentM(lat, lng, aLat, aLng, bLat, bLng) {
  const midLat = ((aLat + bLat) / 2) * (Math.PI / 180);
  const toXY = (la, ln) => ({
    x: ln * M_PER_DEG_LNG_AT_EQUATOR * Math.cos(midLat),
    y: la * M_PER_DEG_LAT,
  });
  const p = toXY(lat, lng);
  const a = toXY(aLat, aLng);
  const b = toXY(bLat, bLng);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distanceM(lat, lng, aLat, aLng);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  return Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
}

/* Which point on the route is closest to where we tapped?
   Returns the index of the segment start plus how far along it we are. */
export function nearestOnRoute(lat, lng, route) {
  let best = { index: 0, distanceM: Infinity };
  for (let i = 0; i < route.length - 1; i++) {
    const d = distanceToSegmentM(lat, lng, route[i][0], route[i][1], route[i + 1][0], route[i + 1][1]);
    if (d < best.distanceM) best = { index: i, distanceM: d };
  }
  return best;
}

/* Total length of the route in metres — for the trip progress bar. */
export function routeLengthM(route) {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += distanceM(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1]);
  }
  return total;
}

/* ============================================================
   DEV SANITY CHECK

   A typo in a latitude looks exactly like a working zone: the app just
   never fires it. Nothing goes red, nothing logs. So we check the pack
   on startup in development and shout in the console if a zone has
   wandered off into the Gulf of Mexico.
   ============================================================ */
export function checkPack(zones, route, bounds, maxDistanceFromRouteM = 6000) {
  const problems = [];
  const [[minLat, minLng], [maxLat, maxLng]] = bounds;

  zones.forEach((z) => {
    if (typeof z.lat !== "number" || typeof z.lng !== "number") {
      problems.push(`${z.id}: lat/lng missing or not a number`);
      return;
    }
    if (z.lat < minLat || z.lat > maxLat || z.lng < minLng || z.lng > maxLng) {
      problems.push(`${z.id}: (${z.lat}, ${z.lng}) is outside the corridor — did you swap lat and lng?`);
    }
    const near = nearestOnRoute(z.lat, z.lng, route);
    if (near.distanceM > maxDistanceFromRouteM) {
      problems.push(`${z.id}: ${Math.round(near.distanceM)} m from the road — it may never fire`);
    }
    if (!z.o?.includes(z.a)) {
      problems.push(`${z.id}: the correct answer "${z.a}" is not one of the four options`);
    }
    if (z.o?.length !== 4) {
      problems.push(`${z.id}: has ${z.o?.length} options, expected 4`);
    }
  });

  /* Two zones sitting on the same spot is a mistake — the same landmark
     entered twice, or a copy-pasted coordinate somebody forgot to edit.

     Overlapping trigger circles, on the other hand, are FINE. Please
     don't "fix" this back to comparing against the sum of the radii.
     When you drive into two zones at once:
       - both questions go into the queue, because queueing happens
         before anything is displayed, so nothing can be lost
       - one gets the big arrival pop-up and the other becomes a small
         toast, which is what the burst throttle does anyway once
         arrivals start coming thick and fast
     Requiring non-overlapping circles meant real landmarks had to be
     thrown away for being near each other, which around Kennedy Space
     Center is most of them. */
  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      const d = distanceM(zones[i].lat, zones[i].lng, zones[j].lat, zones[j].lng);
      if (d < SAME_PLACE_M) {
        problems.push(
          `${zones[i].id} and ${zones[j].id} are only ${Math.round(d)} m apart — same place twice?`
        );
      }
    }
  }

  const ids = zones.map((z) => z.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) problems.push(`duplicate ids: ${[...new Set(dupes)].join(", ")}`);

  return problems;
}
