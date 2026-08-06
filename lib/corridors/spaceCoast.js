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
   almost certainly a transposed coordinate. Extends south to Sebastian
   Inlet, so widen this if the road grows again. */
const bounds = [
  [27.80, -80.92],
  [28.72, -80.40],
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
  [28.2750, -80.6070], // A1A south
  [28.2350, -80.6045], // Patrick Space Force Base
  [28.1760, -80.5960], // Satellite Beach
  [28.1300, -80.5820], // Indian Harbour Beach
  [28.0900, -80.5680], // Indialantic
  [28.0400, -80.5560], // Melbourne Beach
  [27.9500, -80.5170], // Archie Carr refuge
  [27.8600, -80.4520], // Sebastian Inlet
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
    id: "sc-03-max-brewer",
    place: "Max Brewer Bridge",
    lat: 28.6120, lng: -80.7900, radiusM: 1500,
    blurb:
      "Cresting this bridge on a launch day you can see the pads to your north-east and the whole Indian River lagoon underneath you. On the big flights, traffic backs up behind it for miles.",
    q: "The Indian River isn't really a river at all. What is it?",
    o: ["A saltwater lagoon", "A flooded quarry", "A canal", "A tidal creek"],
    a: "A saltwater lagoon",
    d: "Orbit", c: "SpaceX", kind: "water",
  },
  {
    id: "sc-03a-playalinda-turn",
    place: "The Playalinda turn",
    lat: 28.6100, lng: -80.7350, radiusM: 1500,
    blurb:
      "North of here, Canaveral National Seashore runs 24 miles up the coast with no development on it at all — the longest undeveloped barrier island beach in Florida. Playalinda sits at its southern end, closer to the pads than any other public sand.",
    q: "Playalinda Beach shuts completely on launch days. Why?",
    o: [
      "It sits inside the launch hazard area",
      "The crowds damage turtle nests",
      "Parking is reserved for NASA staff",
      "Radio interference from phones",
    ],
    a: "It sits inside the launch hazard area",
    d: "Orbit", c: "SpaceX", kind: "wildlife",
    real: [28.6544, -80.6318], // the beach itself, up SR-402
  },
  {
    id: "sc-03b-nasa-causeway",
    place: "The NASA Causeway",
    lat: 28.5960, lng: -80.7180, radiusM: 1500,
    blurb:
      "You are crossing open water on a road built purely to reach a spaceport. On launch nights this causeway fills with cars, engines off, everyone facing the same direction across the Banana River.",
    q: "Sound from a launch takes a while to reach you across this water. Roughly how long from 10 miles away?",
    o: ["About 45 seconds", "About 5 seconds", "Instantly", "About 4 minutes"],
    a: "About 45 seconds",
    d: "Martian", c: "SpaceX", kind: "water",
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
    d: "Orbit", c: "SpaceX", kind: "wildlife",
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
    d: "Orbit", c: "Starship", kind: "pad", fx: "rollout", vehicle: "starship",
    real: [28.5864, -80.6514],
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
    d: "Orbit", c: "Starship", kind: "pad", fx: "launch", vehicle: "starship",
    real: [28.6083, -80.6044],
  },
  {
    id: "sc-07a-lc39b",
    place: "Launch Complex 39B",
    lat: 28.4800, lng: -80.6600, radiusM: 1500,
    blurb:
      "39A's twin, a mile north. Apollo 10 left from here, and so did the very last Saturn V. It has been rebuilt as a \"clean pad\" — almost nothing permanent on it — so different rockets can bring their own tower.",
    q: "39B is now the pad for NASA's programme to return people to the Moon. What is it called?",
    o: ["Artemis", "Constellation", "Orion", "Gateway"],
    a: "Artemis",
    d: "Orbit", c: "Starship", kind: "pad", fx: "launch", vehicle: "starship",
    real: [28.6272, -80.6208],
  },
  {
    id: "sc-07b-crawlerway",
    place: "The Crawlerway",
    lat: 28.4700, lng: -80.6530, radiusM: 1500,
    blurb:
      "That wide track of river rock running to the pads is the crawlerway, and the machines that use it — the crawler-transporters — are among the largest self-powered vehicles ever built. Loaded, they move a rocket at about a mile an hour.",
    q: "The crawlers have carried rockets since Apollo. Roughly how much do they weigh, empty?",
    o: ["About 6 million pounds", "About 200,000 pounds", "About 50 tons", "About 900 pounds"],
    a: "About 6 million pounds",
    d: "Martian", c: "Starship", kind: "pad", fx: "rollout", vehicle: "starship",
    real: [28.6036, -80.6275],
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
    d: "Earthbound", c: "SpaceX", kind: "pad", fx: "launch", vehicle: "falcon",
    real: [28.5621, -80.5772],
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
    d: "Martian", c: "SpaceX", kind: "pad", fx: "landing", vehicle: "falcon",
    real: [28.4858, -80.5444],
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
    d: "Martian", c: "Elon Personal", kind: "water",
  },
  {
    id: "sc-11-jetty-park",
    place: "Jetty Park",
    lat: 28.3950, lng: -80.6030, radiusM: 1400,
    blurb:
      "A beach and a rock jetty at the mouth of the port, and one of the closest places the public can stand to a launch. People bring folding chairs hours early and watch the rocket clear the treeline.",
    q: "Why do so many launches from here head out east over the Atlantic?",
    o: [
      "Earth's rotation gives a free speed boost eastward",
      "Prevailing winds are easterly",
      "It is the shortest path to orbit",
      "To avoid air traffic inland",
    ],
    a: "Earth's rotation gives a free speed boost eastward",
    d: "Orbit", c: "SpaceX", kind: "water",
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

  /* ---- South down A1A: the barrier island, where the spaceport gives
     way to surf towns and then to some of the most important sea turtle
     beaches on Earth. ---- */

  {
    id: "sc-14-patrick",
    place: "Patrick Space Force Base",
    lat: 28.2350, lng: -80.6045, radiusM: 1500,
    blurb:
      "The road runs straight through the base, ocean on one side and the Banana River on the other. This is the headquarters end of the range — the radar, telemetry and tracking that watches every launch from the moment it clears the tower.",
    q: "The chain of tracking stations reaching from here out across the Atlantic is called what?",
    o: ["The Eastern Range", "The Atlantic Corridor", "Deep Space Network", "The Cape Line"],
    a: "The Eastern Range",
    d: "Orbit", c: "SpaceX",
  },
  {
    id: "sc-15-satellite-beach",
    place: "Satellite Beach",
    lat: 28.1760, lng: -80.5960, radiusM: 1500,
    blurb:
      "A town founded in the late 1950s and named, with total sincerity, after the thing everyone here had come to build. Half of Brevard County grew this way — orange groves one decade, engineers the next.",
    q: "What was the first American satellite, launched from Cape Canaveral in 1958?",
    o: ["Explorer 1", "Sputnik 1", "Vanguard 1", "Telstar"],
    a: "Explorer 1",
    d: "Earthbound", c: "SpaceX",
  },
  {
    id: "sc-16-indialantic",
    place: "Indialantic",
    lat: 28.0900, lng: -80.5680, radiusM: 1500,
    blurb:
      "The causeway here crosses to Melbourne, and the Indian River Lagoon underneath is one of the most biodiverse estuaries in North America — over 4,000 species of plant and animal in water you could wade across.",
    q: "The lagoon has suffered severe algae blooms in recent decades. What mainly drives them?",
    o: [
      "Nutrient runoff from land",
      "Rising water temperature alone",
      "Boat traffic stirring sediment",
      "Salt intrusion from the inlets",
    ],
    a: "Nutrient runoff from land",
    d: "Orbit", c: "SpaceX", kind: "water",
  },
  {
    id: "sc-17-melbourne-beach",
    place: "Melbourne Beach",
    lat: 28.0400, lng: -80.5560, radiusM: 1500,
    blurb:
      "The development thins out from here and the dunes take over. On summer nights the beach is closed to lights — even a phone screen can send a hatchling the wrong way.",
    q: "Why do turtle hatchlings head toward light?",
    o: [
      "They evolved to follow moonlight on the sea",
      "Warmth guides them to the water",
      "They are drawn to other hatchlings",
      "Light means fewer predators",
    ],
    a: "They evolved to follow moonlight on the sea",
    d: "Orbit", c: "SpaceX", kind: "wildlife",
  },
  {
    id: "sc-18-archie-carr",
    place: "Archie Carr National Wildlife Refuge",
    lat: 27.9500, lng: -80.5170, radiusM: 1600,
    blurb:
      "This twenty-mile stretch of sand is the most important loggerhead nesting beach in the western hemisphere. Thousands of females haul out here every summer, most of them returning to within a few miles of where they themselves hatched.",
    q: "Roughly what share of all loggerhead nesting in the United States happens on this one stretch of coast?",
    o: ["About a quarter", "About 2 percent", "About 70 percent", "About 5 percent"],
    a: "About a quarter",
    d: "Martian", c: "SpaceX", kind: "wildlife",
  },
  {
    id: "sc-19-sebastian-inlet",
    place: "Sebastian Inlet",
    lat: 27.8600, lng: -80.4520, radiusM: 1600,
    blurb:
      "The end of the road. The inlet cuts through to the lagoon here, and the sandbar on its north side throws up the best wave in Florida — the break that produced most of the state's competitive surfers.",
    q: "Just offshore lies the wreck of a 1715 fleet that gave this coast its nickname. What is it called?",
    o: ["The Treasure Coast", "The Gold Shore", "The Pirate Coast", "The Silver Banks"],
    a: "The Treasure Coast",
    d: "Martian", c: "SpaceX", kind: "water",
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
