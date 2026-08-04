import { createContext, useContext } from "react";

/* ============================================================
   THEMES — look only. Same questions, same scoring, same rules.

   This block used to live inside components/OrbitTrivia.jsx. It moved
   here so that other components (the road trip screen and its map) can
   read the palette too. Importing it back out of OrbitTrivia.jsx would
   have made a circular import, which breaks in confusing ways.

   Colour roles, so new UI stays on-palette:
     void       page background
     hull       card / panel surface
     hullLight  raised surface inside a card
     edge       borders and hairlines
     ion        primary accent
     plasma     secondary accent
     thrust     success / correct
     abort      error / wrong / urgent
     star       main text
     dim        muted text
   Transparency is done by sticking hex digits on the end of a colour,
   e.g. `${C.ion}44` is the accent at ~27% opacity.
   ============================================================ */
export const THEMES = {
  moon: {
    id: "moon",
    name: "Moon",
    tagline: "Cold, precise, unforgiving",
    void: "#05070F",
    hull: "#0E1424",
    hullLight: "#161E33",
    edge: "#243049",
    ion: "#22D3EE",
    plasma: "#C026D3",
    thrust: "#34D399",
    abort: "#FB4E5A",
    star: "#E8ECF8",
    dim: "#7C89A8",
  },
  mars: {
    id: "mars",
    name: "Mars",
    tagline: "Hot, dusty, a long way from home",
    void: "#0D0604",
    hull: "#1C0F0A",
    hullLight: "#2A1811",
    edge: "#45291D",
    ion: "#FF8C42",
    plasma: "#E85D75",
    thrust: "#7BD389",
    abort: "#FF4D4D",
    star: "#FFF0E6",
    dim: "#A8836F",
  },
};

export const ThemeCtx = createContext(THEMES.moon);

/* Every component calls this to get the current palette: const C = useC(); */
export const useC = () => useContext(ThemeCtx);
