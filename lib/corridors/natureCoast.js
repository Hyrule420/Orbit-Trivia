/* ============================================================
   ROAD TRIP FLORIDA — NATURE COAST

   US-19 from Fanning Springs down to Tarpon Springs.

   How to add a place, and the rules that stop a zone silently never
   firing, are in AUTHORING.md next to this file. Read that before
   adding anything.
   ============================================================ */

/* The map framing, and a sanity check: a zone outside this box is
   almost certainly a transposed coordinate. Widen it whenever the
   route is extended. */
const bounds = [
  [28.10, -83.00],
  [29.65, -82.45],
];

/* The highway itself, as a list of [latitude, longitude] points.

   Three jobs: it draws the blue line on the map, it is the track the
   simulated drive follows, and it is what we measure zones against to
   check they are actually near the road.

   These follow US-19/98 south from Fanning Springs to Hudson. They are
   good enough to drive the simulator and draw a recognisable line;
   they are not survey-grade. Adding more points makes the line smoother
   and the simulator more accurate. */
const route = [
  [29.5877, -82.9337], // Fanning Springs
  [29.5300, -82.9000],
  [29.4747, -82.8598], // Chiefland
  [29.4230, -82.8480],
  [29.3610, -82.8000],
  [29.3230, -82.7700], // Otter Creek (SR-24 west to Cedar Key)
  [29.2600, -82.7350],
  [29.1900, -82.7100],
  [29.1300, -82.7000],
  [29.0800, -82.6800],
  [29.0470, -82.6620], // Inglis
  [29.0000, -82.6480],
  [28.9800, -82.6100],
  [28.9560, -82.6000], // Crystal River Energy Complex is west of here
  [28.9300, -82.5960],
  [28.9025, -82.5926], // Crystal River
  [28.8600, -82.5860],
  [28.8000, -82.5760], // Homosassa Springs
  [28.7500, -82.5760],
  [28.7130, -82.5760], // Chassahowitzka
  [28.6500, -82.5800],
  [28.5900, -82.5800],
  [28.5560, -82.5790], // Brooksville turnoff (SR-50)
  [28.5158, -82.5734], // Weeki Wachee
  [28.4769, -82.6060], // Spring Hill
  [28.4300, -82.6400], // Aripeka
  [28.3900, -82.6700],
  [28.3644, -82.6890], // Hudson
  [28.3300, -82.6910], // Bayonet Point
  [28.3050, -82.6950], // Werner-Boyce Salt Springs
  [28.2700, -82.7130], // Port Richey
  [28.2350, -82.7200], // New Port Richey
  [28.2000, -82.7330], // Anclote River
  [28.1750, -82.7450], // Holiday
  [28.1600, -82.7550], // Tarpon Springs sponge docks
  [28.1300, -82.7590], // Spring Bayou
];

/* ============================================================
   THE QUESTIONS
   Ordered north to south, the way you'd drive them.
   ============================================================ */
const zones = [
  {
    id: "nc-01-fanning-springs",
    place: "Fanning Springs",
    lat: 29.5877, lng: -82.9337, radiusM: 2200,
    blurb:
      "The spring here pours into the Suwannee River, and it is a first-magnitude spring — the top tier, meaning it pushes out more than 100 cubic feet of water every second. Florida has more of these than anywhere else on Earth.",
    q: "Florida sits on a limestone aquifer full of springs. What is the state's nickname for that whole underground system?",
    o: ["The Floridan Aquifer", "The Everglades Basin", "The Gulf Shelf", "The Ocala Reservoir"],
    a: "The Floridan Aquifer",
    d: "Earthbound", c: "Nature Coast",
  },
  {
    id: "nc-02-chiefland",
    place: "Chiefland",
    lat: 29.4747, lng: -82.8598, radiusM: 2500,
    blurb:
      "Chiefland calls itself the Gem of the Suwannee Valley. Just west of town, Manatee Springs State Park pumps out around 100 million gallons a day into the Suwannee — the naturalist William Bartram wrote about it back in 1774.",
    q: "Manatee Springs State Park is named for an animal that shelters there in winter. Why do manatees crowd into Florida's springs when it gets cold?",
    o: [
      "Springs stay a near-constant 72°F year round",
      "The springs are saltier than the Gulf",
      "They feed on spring algae only in winter",
      "The current pushes them upstream to breed",
    ],
    a: "Springs stay a near-constant 72°F year round",
    d: "Earthbound", c: "Nature Coast",
    real: [29.4969, -82.9668], // Manatee Springs, west of town
  },
  {
    id: "nc-02a-astronomy-village",
    place: "Chiefland Astronomy Village",
    lat: 29.4320, lng: -82.8501, radiusM: 2100,
    blurb:
      "Off in the woods east of here is a small community built entirely around the one thing Florida is running out of: darkness. Amateur astronomers moved out to this spot because the sky above it is among the blackest you can still drive to in the state.",
    q: "Astronomers rate how dark a sky is on a nine-point scale. What is it called?",
    o: ["The Bortle scale", "The Kelvin scale", "The Messier scale", "The Hubble scale"],
    a: "The Bortle scale",
    d: "Orbit", c: "Nature Coast",
  },
  {
    id: "nc-02b-andrews-tract",
    place: "Andrews Wildlife Management Area",
    lat: 29.3946, lng: -82.8260, radiusM: 2100,
    blurb:
      "West of the road, running down to the Suwannee, is one of the largest surviving stands of old-growth hardwood left in Florida. Several trees in there are state champions — the biggest known individual of their species anywhere in Florida.",
    q: "Most of Florida's old-growth hardwood is long gone. What took it?",
    o: [
      "Logging in the late 1800s and early 1900s",
      "Hurricanes in the 1920s",
      "A blight in the 1950s",
      "Clearance for citrus in the 1970s",
    ],
    a: "Logging in the late 1800s and early 1900s",
    d: "Orbit", c: "Nature Coast",
  },
  {
    id: "nc-02c-rosewood",
    place: "Rosewood",
    lat: 29.3587, lng: -82.7982, radiusM: 2100,
    blurb:
      "South-west of here, out toward Cedar Key, stood the town of Rosewood — a largely Black community of a few hundred people. In January 1923 a white mob destroyed it over the course of a week. The survivors fled and the town was never rebuilt. Almost nothing marks the site today but a state historical plaque.",
    q: "In 1994 Florida did something over Rosewood that no US state had done before. What?",
    o: [
      "Compensated survivors and their descendants",
      "Issued a formal apology to the county",
      "Made the site a national monument",
      "Reopened the criminal case",
    ],
    a: "Compensated survivors and their descendants",
    d: "Martian", c: "Nature Coast",
    real: [29.2333, -82.9333],
  },
  {
    id: "nc-03-otter-creek",
    place: "Otter Creek — the Cedar Key turn",
    lat: 29.3230, lng: -82.7700, radiusM: 2500,
    blurb:
      "Turn west here on SR-24 and you reach Cedar Key, 20 miles out in the Gulf. In the 1800s it was one of Florida's busiest ports, shipping cedar to the pencil mills, until the trees ran out and a hurricane finished the job in 1896.",
    q: "Cedar Key reinvented itself and now leads Florida in farming which shellfish?",
    o: ["Hard clams", "Blue crab", "Bay scallops", "Oysters"],
    a: "Hard clams",
    d: "Orbit", c: "Nature Coast",
  },
  {
    id: "nc-04-goethe-forest",
    place: "Goethe State Forest",
    lat: 29.2600, lng: -82.7350, radiusM: 2500,
    blurb:
      "East of the road are more than 50,000 acres of longleaf pine — one of the best surviving stands in Florida. It is home to the red-cockaded woodpecker, which is fussy enough to nest only in living pines old enough to have gone soft in the middle.",
    q: "Longleaf pine forest depends on something most landscapes are protected from. What?",
    o: ["Regular fire", "Seasonal flooding", "Winter frost", "Salt spray"],
    a: "Regular fire",
    d: "Orbit", c: "Nature Coast",
  },
  {
    id: "nc-05-levy-nuclear",
    place: "Levy County",
    lat: 29.1900, lng: -82.7100, radiusM: 2500,
    blurb:
      "Somewhere out in these pines was going to be the Levy Nuclear Plant — two reactors, announced in 2008. After years of delays and billions committed, Duke Energy cancelled it outright in 2017 without a reactor ever being built.",
    q: "Tesla's utility-scale battery, used to steady grids as old power plants retire, is called what?",
    o: ["Megapack", "Powerwall", "Powerpack", "Gigapack"],
    a: "Megapack",
    d: "Orbit", c: "Energy",
  },
  {
    id: "nc-05a-waccasassa",
    place: "Waccasassa Bay Preserve",
    lat: 29.1405, lng: -82.7018, radiusM: 2200,
    blurb:
      "Between the road and the Gulf sits about 34,000 acres of saltmarsh, tidal creek and cabbage palm hammock with no road into any of it. If you want to see Waccasassa Bay, you go by boat or you don't go.",
    q: "As the sea slowly rises here, the coastal forest is dying and being replaced by saltmarsh. What are the dead standing trees left behind called?",
    o: ["A ghost forest", "A salt barren", "A drowned hammock", "A tide wood"],
    a: "A ghost forest",
    d: "Orbit", c: "Nature Coast",
  },
  {
    id: "nc-05b-port-inglis",
    place: "Port Inglis",
    lat: 29.0927, lng: -82.6851, radiusM: 2200,
    blurb:
      "Down at the mouth of the Withlacoochee, west of here, there was once a working port. Phosphate came in by rail and went out by ship, and a town grew up around it. Storms and the collapse of the phosphate trade finished it, and there is essentially nothing left of Port Inglis now.",
    q: "Florida phosphate was shipped out by the ton for most of the twentieth century. What was nearly all of it used for?",
    o: ["Fertiliser", "Concrete", "Glassmaking", "Steel"],
    a: "Fertiliser",
    d: "Martian", c: "Nature Coast",
  },
  {
    id: "nc-06-inglis-barge-canal",
    place: "Inglis — Cross Florida Barge Canal",
    lat: 29.0470, lng: -82.6620, radiusM: 2500,
    blurb:
      "You are crossing one of America's great abandoned megaprojects. The Cross Florida Barge Canal was meant to cut clean across the state so ships could skip the Keys. Digging started in 1964. It was stopped part-built, and the scar is now a greenway.",
    q: "Which US president halted the Cross Florida Barge Canal in 1971 over environmental damage?",
    o: ["Richard Nixon", "Lyndon Johnson", "Jimmy Carter", "Gerald Ford"],
    a: "Richard Nixon",
    d: "Martian", c: "Nature Coast",
  },
  {
    id: "nc-07-yankeetown",
    place: "Yankeetown & the Withlacoochee",
    lat: 28.9950, lng: -82.6450, radiusM: 2200,
    blurb:
      "Yankeetown got its name from the northerners who wintered here. In 1961 Elvis Presley turned up to film Follow That Dream on the road out to the Gulf — locals still call it Follow That Dream Parkway.",
    q: "The Withlacoochee River, which reaches the Gulf here, is unusual among Florida rivers because it does what?",
    o: ["Flows north", "Runs entirely underground", "Reverses twice daily", "Never reaches the sea"],
    a: "Flows north",
    d: "Martian", c: "Nature Coast",
  },
  {
    id: "nc-08-crystal-river-energy",
    place: "Crystal River Energy Complex",
    lat: 28.9560, lng: -82.6000, radiusM: 2500,
    blurb:
      "Off to your west on the coast is Duke Energy's Crystal River site. Its nuclear unit was shut for good in 2013 after a botched repair cracked the containment building. Two coal stacks were brought down by controlled demolition in 2020.",
    q: "Taking a nuclear plant apart is slow work. Roughly how long does full decommissioning typically take?",
    o: ["Decades", "About a year", "Around five years", "It is never dismantled"],
    a: "Decades",
    d: "Martian", c: "Energy",
    real: [28.9581, -82.6997],
  },
  {
    id: "nc-09-crystal-river",
    place: "Crystal River",
    lat: 28.9025, lng: -82.5926, radiusM: 2500,
    blurb:
      "Kings Bay, just west of you, is fed by dozens of springs and fills with manatees every winter. Three Sisters Springs is the crown jewel — and this is the one place in the United States where you may legally swim with wild manatees.",
    q: "The Florida manatee's closest living relative is a surprise. Which animal is it?",
    o: ["The elephant", "The walrus", "The hippopotamus", "The dolphin"],
    a: "The elephant",
    d: "Orbit", c: "Nature Coast",
  },
  {
    id: "nc-10-crystal-river-mounds",
    place: "Crystal River Archaeological State Park",
    lat: 28.8600, lng: -82.5860, radiusM: 2000,
    blurb:
      "Just north-west of here is a complex of temple mounds, burial mounds and a plaza that people used for roughly 1,600 years — one of the longest continuously occupied pre-Columbian sites anywhere in Florida.",
    q: "The mounds were built by hand from what material, hauled basket by basket?",
    o: ["Shell and earth", "Quarried limestone", "Fired brick", "Cypress logs"],
    a: "Shell and earth",
    d: "Martian", c: "Nature Coast",
    real: [28.9093, -82.6286],
  },
  {
    id: "nc-11-homosassa",
    place: "Homosassa Springs Wildlife State Park",
    lat: 28.8000, lng: -82.5760, radiusM: 2500,
    blurb:
      "The park here has an underwater observatory built right into the spring — you walk below the surface and the fish swim past the glass. For decades its most famous resident was Lu, a hippopotamus who lived to 64.",
    q: "The park is a wildlife hospital, so most animals there are rehabilitating. Lu the hippo stayed permanently after a Florida governor did what in 1991?",
    o: [
      "Made him an honorary Florida citizen",
      "Bought the park for the state",
      "Named him the state mascot",
      "Passed a law banning hippo transport",
    ],
    a: "Made him an honorary Florida citizen",
    d: "Orbit", c: "Nature Coast",
  },
  {
    id: "nc-12-chassahowitzka",
    place: "Chassahowitzka National Wildlife Refuge",
    lat: 28.7130, lng: -82.5760, radiusM: 2500,
    blurb:
      "West of the road is 30,000 acres of saltmarsh and swamp with almost no road access at all. In the 2000s it was the winter destination for young whooping cranes taught to migrate by following an ultralight aircraft south from Wisconsin.",
    q: "Whooping cranes are North America's tallest bird. By the 1940s the entire wild population had fallen to roughly how many?",
    o: ["About 20", "About 200", "About 2,000", "About 20,000"],
    a: "About 20",
    d: "Martian", c: "Nature Coast",
  },
  {
    id: "nc-13-big-bend-seagrass",
    place: "Big Bend Seagrasses",
    lat: 28.6500, lng: -82.5800, radiusM: 2500,
    blurb:
      "The shallows off this stretch hold one of the largest seagrass beds in the world. It is why the water is so clear, why the scallops are here, and why the manatees have anything to eat.",
    q: "Seagrass meadows are prized by climate scientists mainly because they do what unusually well?",
    o: [
      "Lock away carbon in the seabed",
      "Reflect sunlight back to space",
      "Produce most of the world's oxygen",
      "Cool the water they grow in",
    ],
    a: "Lock away carbon in the seabed",
    d: "Orbit", c: "Nature Coast",
  },
  {
    id: "nc-14-brooksville",
    place: "The Brooksville turn",
    /* Kept deliberately small: the SR-50 junction sits close to Weeki
       Wachee, and at 2200 m the two circles overlapped. */
    lat: 28.5560, lng: -82.5790, radiusM: 1900,
    blurb:
      "SR-50 heads east from here to Brooksville, up on one of the few real hills in this part of Florida. The ridge is old sand dune, left behind when sea levels were far higher than they are now.",
    q: "Florida's highest point, Britton Hill, is the lowest state high point in the country. How tall is it?",
    o: ["345 feet", "1,020 feet", "112 feet", "2,400 feet"],
    a: "345 feet",
    d: "Orbit", c: "Nature Coast",
  },
  {
    id: "nc-15-weeki-wachee",
    place: "Weeki Wachee Springs",
    lat: 28.5158, lng: -82.5734, radiusM: 2500,
    blurb:
      "The mermaids have been performing here since 1947. A former Navy frogman instructor named Newton Perry worked out how to let swimmers breathe from air hoses hidden in the scenery, so they could stay under and act. It is now a state park.",
    q: "Weeki Wachee is one of the deepest known naturally formed springs in the United States. Divers have gone past what depth without finding the bottom?",
    o: ["400 feet", "80 feet", "150 feet", "1,200 feet"],
    a: "400 feet",
    d: "Martian", c: "Nature Coast",
  },
  {
    id: "nc-16-spring-hill",
    place: "Spring Hill",
    lat: 28.4769, lng: -82.6060, radiusM: 2200,
    blurb:
      "Spring Hill was laid out in the 1960s by developers selling Florida by mail order to buyers up north — many of whom bought a lot sight unseen. The Suncoast Parkway now runs behind town, connecting all of this to Tampa.",
    q: "The Suncoast Parkway is a toll road. Florida's electronic tolling system is called what?",
    o: ["SunPass", "E-ZPass", "FasTrak", "GoldKey"],
    a: "SunPass",
    d: "Earthbound", c: "Nature Coast",
  },
  {
    id: "nc-17-aripeka",
    place: "Aripeka",
    lat: 28.4300, lng: -82.6400, radiusM: 2000,
    blurb:
      "A tiny fishing village straddling the Hernando–Pasco line, named after a Seminole leader. It has stayed almost exactly as it was — a few dozen houses, a bait shop, and mangrove creeks running out to the Gulf.",
    q: "Mangroves are protected in Florida largely because of what they do during a hurricane. What is it?",
    o: [
      "Absorb storm surge and hold the shoreline together",
      "Break up the wind before it reaches land",
      "Lower the water temperature that fuels the storm",
      "Shelter boats from lightning",
    ],
    a: "Absorb storm surge and hold the shoreline together",
    d: "Orbit", c: "Nature Coast",
  },
  {
    id: "nc-18-hudson",
    place: "Hudson",
    lat: 28.3644, lng: -82.6890, radiusM: 2500,
    blurb:
      "You are at the southern edge of the Nature Coast. From here the shoreline starts turning into the built-up Gulf coast — Port Richey, New Port Richey, then Tampa Bay. The quiet part of the drive is behind you.",
    q: "Roughly how many miles of the Nature Coast shoreline have no bridges, causeways or beach resorts on them?",
    o: ["Around 200", "Around 20", "Around 700", "Around 40"],
    a: "Around 200",
    d: "Martian", c: "Nature Coast",
  },

  /* ---- Below Hudson the road leaves the Nature Coast and runs through
     Pasco and north Pinellas. Traffic slows to about 45 mph and the
     landmarks sit much closer together, so these zones use smaller
     radii (1500-2000 m) and sit closer than the 4 km used up north.
     A 1500 m zone at 45 mph is still about two minutes inside it, and
     the tighter radii keep the circles from overlapping. ---- */

  {
    id: "nc-19-werner-boyce",
    place: "Werner-Boyce Salt Springs State Park",
    lat: 28.3050, lng: -82.6950, radiusM: 2000,
    blurb:
      "West of the road is Pasco County's only state park on the Gulf, and at the middle of it is a salt spring — a sinkhole about 320 feet deep, brackish rather than fresh, connecting straight down into the aquifer.",
    q: "The spring here is brackish. What does that mean?",
    o: [
      "A mix of fresh and salt water",
      "Water with no oxygen in it",
      "Water warmer than the surrounding sea",
      "Water heavy with sulphur",
    ],
    a: "A mix of fresh and salt water",
    d: "Earthbound", c: "Gulf Coast",
    real: [28.3169, -82.7150],
  },
  {
    id: "nc-20-port-richey",
    place: "Port Richey — the Cotee River",
    lat: 28.2700, lng: -82.7130, radiusM: 1800,
    blurb:
      "You are crossing the Pithlachascotee River, which absolutely nobody says in full — locals have called it the Cotee for a century. Port Richey grew up as a fishing village and spent decades trying, without much luck, to become a resort.",
    q: "Florida is full of place names taken from the languages of the people who were here first. Which language family gives us most of them, including Pithlachascotee?",
    o: ["Muskogean", "Latin", "Spanish", "Norse"],
    a: "Muskogean",
    d: "Martian", c: "Gulf Coast",
  },
  {
    id: "nc-21-new-port-richey",
    place: "New Port Richey — the Hacienda Hotel",
    lat: 28.2350, lng: -82.7200, radiusM: 1800,
    blurb:
      "In the 1920s this town genuinely tried to become a film colony. The silent-era star Thomas Meighan summered here and brought Hollywood friends with him; the Spanish-style Hacienda Hotel opened in 1927 to house them, and after decades shuttered it has been restored and reopened.",
    q: "The film colony plan collapsed along with Florida's 1920s land boom. What finished the boom off?",
    o: [
      "A 1926 hurricane and a banking collapse",
      "A statewide drought",
      "The arrival of air conditioning",
      "A ban on land sales by mail",
    ],
    a: "A 1926 hurricane and a banking collapse",
    d: "Orbit", c: "Gulf Coast",
  },
  {
    id: "nc-22-anclote",
    place: "Anclote River & Anclote Key",
    lat: 28.2000, lng: -82.7330, radiusM: 1800,
    blurb:
      "Three miles offshore sits Anclote Key, with an iron lighthouse built in 1887 that still stands. There is no bridge and never has been — the island is reachable only by boat, which is a large part of why it still looks the way it does.",
    q: "\"Anclote\" is Spanish. What does it mean?",
    o: ["A small anchor", "A hidden channel", "Sponge", "Sandbar"],
    a: "A small anchor",
    d: "Orbit", c: "Gulf Coast",
    real: [28.1671, -82.8447], // the lighthouse at the key's south end
  },
  {
    id: "nc-23-sponge-docks",
    place: "Tarpon Springs Sponge Docks",
    lat: 28.1600, lng: -82.7550, radiusM: 1800,
    blurb:
      "In 1905 John Cocoris brought Greek divers over from the Dodecanese islands to work the sponge beds here, and their descendants still run this waterfront. The main street is Dodecanese Boulevard, and Tarpon Springs has the highest proportion of Greek-Americans of any city in the country.",
    q: "The sponge industry here nearly died in the 1940s. What killed it?",
    o: [
      "A blight that wiped out the sponge beds",
      "The divers were conscripted into the war",
      "A hurricane destroyed the fleet",
      "Sponges were banned as a health risk",
    ],
    a: "A blight that wiped out the sponge beds",
    d: "Martian", c: "Gulf Coast",
  },
  {
    id: "nc-24-spring-bayou",
    place: "Spring Bayou — the Epiphany dive",
    lat: 28.1300, lng: -82.7590, radiusM: 1500,
    blurb:
      "Every 6 January, thousands fill the banks of this bayou for Greek Orthodox Epiphany. The archbishop throws a white wooden cross into the water and teenage boys dive in after it — whoever surfaces with it is said to have a year of blessings. It is the largest Epiphany celebration in the United States.",
    q: "Epiphany on 6 January marks what, in the Orthodox tradition?",
    o: [
      "The baptism of Christ",
      "The end of the harvest",
      "The founding of the church",
      "The first day of Lent",
    ],
    a: "The baptism of Christ",
    d: "Earthbound", c: "Gulf Coast",
  },
];

export const natureCoast = {
  id: "nature-coast",
  name: "Nature Coast",
  road: "US-19",
  tagline: "Springs, manatees, mermaids, and a canal that went nowhere.",
  bounds,
  route,
  zones,
};
