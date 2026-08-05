/* ============================================================
   ROAD TRIP FLORIDA — SPACE COAST

   Titusville down through Kennedy Space Center and Merritt Island to
   Port Canaveral and Cocoa Beach.

   A note specific to this pack: almost everything worth asking about
   here is behind a fence. You cannot drive to Launch Complex 39A. So
   the pins sit on the public road and the blurbs point — "off to your
   north" — exactly the way the Nature Coast pack handles islands you
   can only reach by boat.

   How to add a place, and the rules that stop a zone silently never
   firing, are in AUTHORING.md next to this file.
   ============================================================ */

/* The map framing, and a sanity check: a zone outside this box is
   almost certainly a transposed coordinate. */
const bounds = [
  [28.28, -80.92],
  [28.72, -80.53],
];

/* US-1 through Titusville, east on the NASA Causeway, south down SR-3
   across Merritt Island, then out to Port Canaveral and down A1A. */
const route = [
  [28.6600, -80.8200], // US-1, north Titusville
  [28.6260, -80.8080], // Space View Park
  [28.6120, -80.8070], // downtown Titusville
  [28.6120, -80.7900], // Max Brewer Bridge over the Indian River
  [28.6100, -80.7500], // NASA Causeway
  [28.5850, -80.7050], // Merritt Island NWR
  [28.5230, -80.6819], // KSC Visitor Complex
  [28.5000, -80.6700], // SR-3 south
  [28.4600, -80.6450],
  [28.4200, -80.6200], // SR-528 / Port Canaveral approach
  [28.4080, -80.6050], // Port Canaveral
  [28.3950, -80.6030], // Jetty Park
  [28.3650, -80.6050], // Cocoa Beach north
  [28.3200, -80.6080], // Cocoa Beach pier
];

const zones = [
  {
    id: "sc-01-titusville-north",
    place: "Titusville — the launch town",
    lat: 28.6600, lng: -80.8200, radiusM: 1500,
    blurb:
      "This town has watched every American crewed launch since Apollo from across the water. When a Saturn V went up, the ground here shook hard enough to crack windows.",
    q: "Titusville earned a nickname from all this. What is it?",
    o: ["Space City USA", "Rocket Town", "Cape City", "Launch Harbor"],
    a: "Space City USA",
    d: "Earthbound", c: "SpaceX",
  },
  {
    id: "sc-02-space-view-park",
    place: "Space View Park",
    lat: 28.6260, lng: -80.8080, radiusM: 1500,
    blurb:
      "A small riverfront park with the best free launch view anywhere — a straight line across the Indian River to the pads. The Space Walk of Fame here has handprints from Mercury, Gemini and Apollo astronauts set into the monuments.",
    q: "Roughly how far is it across the water from here to Launch Complex 39A?",
    o: ["About 12 miles", "About 2 miles", "About 40 miles", "About 100 miles"],
    a: "About 12 miles",
    d: "Orbit", c: "SpaceX",
  },
  {
    id: "sc-04-merritt-island-nwr",
    place: "Merritt Island National Wildlife Refuge",
    lat: 28.5850, lng: -80.7050, radiusM: 1500,
    blurb:
      "NASA owns far more land than it builds on, and the buffer around the launch pads became a wildlife refuge. Alligators, manatees and roseate spoonbills live inside the fence of an active spaceport — one of the densest concentrations of protected species in the country.",
    q: "Why does a spaceport need so much empty land around it?",
    o: [
      "A blast and debris buffer if a rocket fails",
      "To keep the ground dry enough to build on",
      "Tax rules on federal land",
      "To stop radio interference",
    ],
    a: "A blast and debris buffer if a rocket fails",
    d: "Orbit", c: "SpaceX",
  },
  {
    id: "sc-05-vab",
    place: "The Vehicle Assembly Building",
    lat: 28.5560, lng: -80.6920, radiusM: 1500,
    blurb:
      "That enormous box on the horizon is the VAB, built to stack the Saturn V upright. It is so large that it has its own weather — on humid days, clouds have been known to form near the ceiling.",
    q: "The VAB is one of the largest buildings on Earth by volume. What were its doors built to do?",
    o: [
      "Open tall enough for a fully stacked Saturn V to roll out",
      "Seal airtight against hurricanes",
      "Slide sideways into the ground",
      "Withstand a launch pad explosion",
    ],
    a: "Open tall enough for a fully stacked Saturn V to roll out",
    d: "Orbit", c: "Starship",
  },
  {
    id: "sc-06-ksc-visitor",
    place: "Kennedy Space Center Visitor Complex",
    lat: 28.5230, lng: -80.6819, radiusM: 1500,
    blurb:
      "Inside is a complete Saturn V lying on its side — all 363 feet of it — and the orbiter Atlantis, displayed tilted as if in flight with its payload bay open.",
    q: "Only three flown Space Shuttle orbiters survive on display. Atlantis is here. Where are the other two?",
    o: [
      "Virginia and California",
      "Texas and Alabama",
      "Ohio and New York",
      "Washington and Arizona",
    ],
    a: "Virginia and California",
    d: "Martian", c: "SpaceX",
  },
  {
    id: "sc-07-lc39a",
    place: "Launch Complex 39A",
    lat: 28.4930, lng: -80.6680, radiusM: 1500,
    blurb:
      "North of you is the most famous piece of concrete in spaceflight. Apollo 11 left from 39A. So did the final Space Shuttle. SpaceX leases it now and flies Falcon Heavy from it, with a Starship tower going up alongside.",
    q: "What is the crawlerway — the wide gravel road leading to the pad — actually for?",
    o: [
      "Carrying rockets to the pad on a tracked transporter",
      "Draining the launch flame trench",
      "Emergency vehicle access only",
      "A runway for landing boosters",
    ],
    a: "Carrying rockets to the pad on a tracked transporter",
    d: "Orbit", c: "Starship",
  },
  {
    id: "sc-08-slc40",
    place: "Space Launch Complex 40",
    lat: 28.4600, lng: -80.6450, radiusM: 1500,
    blurb:
      "The workhorse. Most Falcon 9 flights leave from SLC-40, often several times a month — a cadence that would have been unthinkable when this pad was flying Titan rockets in the 1960s.",
    q: "What makes that launch rate possible?",
    o: [
      "The first stage is reused, not thrown away",
      "The rockets are much smaller",
      "Launches are automated from orbit",
      "Fuel is delivered by pipeline",
    ],
    a: "The first stage is reused, not thrown away",
    d: "Earthbound", c: "SpaceX",
  },
  {
    id: "sc-09-landing-zones",
    place: "Landing Zones 1 & 2",
    lat: 28.4280, lng: -80.6270, radiusM: 1500,
    blurb:
      "Two circles of concrete where Falcon boosters come back and land upright, minutes after launching. When two land together on a Falcon Heavy flight, the double sonic boom rolls across the whole Space Coast.",
    q: "This site was rebuilt from an older pad. What used to fly from here?",
    o: ["Atlas missiles", "The Space Shuttle", "Saturn V", "Nothing — it was marsh"],
    a: "Atlas missiles",
    d: "Martian", c: "SpaceX",
  },
  {
    id: "sc-10-port-canaveral",
    place: "Port Canaveral",
    lat: 28.4080, lng: -80.6050, radiusM: 1500,
    blurb:
      "Boosters that land at sea come home through here, riding a droneship and then standing on the dock like a returned building. It is also one of the busiest cruise ports in the world, so the same water carries both.",
    q: "SpaceX names its droneships after starships from a science fiction series. Which author?",
    o: ["Iain M. Banks", "Isaac Asimov", "Arthur C. Clarke", "Ursula K. Le Guin"],
    a: "Iain M. Banks",
    d: "Martian", c: "Elon Personal",
  },
  {
    id: "sc-12-cocoa-beach",
    place: "Cocoa Beach",
    lat: 28.3650, lng: -80.6050, radiusM: 1500,
    blurb:
      "In the 1960s this strip was where the astronauts and the press drank. It is also the surfing capital of the East Coast, and the hometown of an eleven-time world champion.",
    q: "Which surfer, born here, won eleven world titles?",
    o: ["Kelly Slater", "Laird Hamilton", "Duke Kahanamoku", "Bethany Hamilton"],
    a: "Kelly Slater",
    d: "Earthbound", c: "Elon Personal",
  },
  {
    id: "sc-13-cocoa-pier",
    place: "Cocoa Beach Pier",
    lat: 28.3200, lng: -80.6080, radiusM: 1500,
    blurb:
      "The end of the road. From the pier you are looking back up the coast at the pads, and on a clear night a launch lights the whole beach — the rocket climbing, then the long slow arc downrange over the sea.",
    q: "What is the glowing trail sometimes left high in the sky after a dusk launch called?",
    o: [
      "A twilight phenomenon, lit by sunlight above the horizon",
      "Ionised air from re-entry",
      "Burning solid fuel residue",
      "A contrail from chase aircraft",
    ],
    a: "A twilight phenomenon, lit by sunlight above the horizon",
    d: "Martian", c: "Starship",
  },
];

export const spaceCoast = {
  id: "space-coast",
  name: "Space Coast",
  road: "US-1 & A1A",
  tagline: "Launch pads, the world's biggest shed, and boosters coming home.",
  bounds,
  route,
  zones,
};
