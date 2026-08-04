"use client";

import React from "react";
import dynamic from "next/dynamic";

/* ============================================================
   The only safe way to put Leaflet into a Next.js app.

   Next renders components on the server first. Leaflet reads `window`
   as soon as it is imported, and there is no `window` on a server, so
   importing it normally crashes the page. `ssr: false` tells Next to
   skip the server entirely for this one component and load it in the
   browser instead.

   IMPORTANT: this file must never import leaflet or react-leaflet
   itself — that would defeat the whole arrangement. Keep those imports
   inside GeoMap.jsx.

   The dynamic() call sits at the top level of the module on purpose. If
   it were created inside the component it would produce a brand new
   component type on every render, and React would tear the map down and
   rebuild it from scratch — including every time you switched theme.

   The placeholder reserves height so the page does not jump when the
   real map swaps in. It uses fixed dark colours rather than the theme,
   because it is on screen for a fraction of a second and pulling the
   theme in here is what forced the remount in the first place.
   ============================================================ */

const GeoMap = dynamic(() => import("./GeoMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 300, borderRadius: 18, background: "#0E1424", border: "1px solid #243049" }} />
  ),
});

export default function MapPanel(props) {
  return <GeoMap {...props} />;
}
