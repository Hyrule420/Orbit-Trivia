"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Circle, CircleMarker, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useC } from "../../lib/theme";

/* ============================================================
   THE MAP.

   This file is the only one that touches Leaflet, and it is loaded
   through MapPanel.jsx with server rendering switched off. Leaflet
   reaches for `window` the moment it is imported, so importing it
   anywhere that runs on the server crashes the build.

   Deliberate choice: no default Leaflet markers anywhere. Their icons
   are PNG files whose paths the bundler rewrites, which is why almost
   every Leaflet-in-React project ends up with broken grey squares
   instead of pins. Circles and CircleMarkers are drawn as plain SVG, so
   there is nothing to break — and as a bonus they take their colours
   straight from the theme.

   The map is decoration. Tiles need a network connection, and US-19 has
   real dead zones. Everything that actually matters — spotting zones,
   queueing questions, scoring — is pure maths and keeps working when
   the tiles do not load.
   ============================================================ */

/* How much of the drive stays visible behind the car. */
const TRAIL_POINTS = 40;

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/* Keeps the car in view as it moves, without fighting the user: if they
   have dragged the map somewhere, we only recentre when the car has
   wandered well outside what they are looking at. */
function FollowCar({ lat, lng, follow }) {
  const map = useMap();
  useEffect(() => {
    if (!follow || lat == null) return;
    if (!map.getBounds().pad(-0.25).contains([lat, lng])) {
      map.panTo([lat, lng], { animate: true });
    }
  }, [lat, lng, follow, map]);
  return null;
}

/* Tap anywhere to drop yourself there. Only mounted when the position
   is simulated — teleporting during a real drive makes no sense. */
function ClickCatcher({ onTeleport }) {
  useMapEvents({
    click(e) { onTeleport(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

/* Leaflet sizes itself when it mounts. If it mounts inside something
   that was hidden or still animating, it measures zero and renders a
   grey box until told to look again. */
function SizeFixer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function GeoMap({
  route, zones, pos, answeredIds, queuedIds, bounds, follow = true, onTeleport, mars, height = 300,
  nearestId,
}) {
  const C = useC();

  /* Where we've actually been, drawn as a fading tail behind the car.
     Capped, because a 90-minute drive would otherwise accumulate
     thousands of points and the map would slow to a crawl. */
  const trailRef = useRef([]);
  if (pos) {
    const last = trailRef.current[trailRef.current.length - 1];
    if (!last || last[0] !== pos.lat || last[1] !== pos.lng) {
      trailRef.current = [...trailRef.current, [pos.lat, pos.lng]].slice(-TRAIL_POINTS);
    }
  }

  /* The car: an inline HTML arrow, rotated to match our heading. Built
     with divIcon so there is no image file involved. */
  const carIcon = useMemo(() => {
    if (typeof window === "undefined") return null;
    const rotation = pos?.headingDeg ?? 0;
    return L.divIcon({
      className: "",
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      html: `
        <div style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:26px;height:26px;border-radius:50%;background:${C.thrust}33;"></div>
          <svg width="16" height="16" viewBox="0 0 24 24" style="transform:rotate(${rotation}deg);position:relative;">
            <path d="M12 2 L19 21 L12 17 L5 21 Z" fill="${C.thrust}" stroke="${C.void}" stroke-width="1.5"/>
          </svg>
        </div>`,
    });
  }, [pos?.headingDeg, C.thrust, C.void]);

  const center = pos ? [pos.lat, pos.lng] : [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];

  return (
    <>
      <style>{`
        .nc-map .leaflet-control-attribution {
          background: ${C.void}CC; color: ${C.dim}; font-size: 9px; border-radius: 6px 0 0 0;
        }
        .nc-map .leaflet-control-attribution a { color: ${C.dim}; }
        .nc-map .leaflet-container { background: ${C.void}; outline: none; }
        /* Mars runs warm, so the tiles get warmed to match rather than
           swapping to a whole different tile provider. */
        .nc-map-mars .leaflet-tile-pane { filter: sepia(.4) hue-rotate(-18deg) saturate(1.3); }

        /* The zone you're heading for breathes, so there is always
           something on the map telling you what's coming. Pure CSS on
           the SVG path — no animation loop, which matters on a screen
           that already holds a GPS watch and a wake lock for an hour. */
        @keyframes nc-zone-pulse {
          0%,100% { stroke-opacity: .35; stroke-width: 1; }
          50%     { stroke-opacity: 1;   stroke-width: 3; }
        }
        .nc-map .nc-next { animation: nc-zone-pulse 2.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .nc-map .nc-next { animation: none; stroke-opacity: .8; }
        }
      `}</style>

      <div className={`nc-map ${mars ? "nc-map-mars" : ""}`} style={{ borderRadius: 18, overflow: "hidden", border: `1px solid ${C.edge}` }}>
        <MapContainer
          center={center}
          zoom={10}
          style={{ height, width: "100%", background: C.void }}
          zoomControl={false}
          scrollWheelZoom={false}
          attributionControl
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
          <SizeFixer />
          <FollowCar lat={pos?.lat} lng={pos?.lng} follow={follow} />
          {onTeleport && <ClickCatcher onTeleport={onTeleport} />}

          {/* The highway */}
          <Polyline positions={route} pathOptions={{ color: C.ion, weight: 3, opacity: 0.55 }} />

          {/* Where you've already been */}
          {trailRef.current.length > 1 && (
            <Polyline
              positions={trailRef.current}
              pathOptions={{ color: C.thrust, weight: 4, opacity: 0.4 }}
            />
          )}

          {/* Every zone: a faint circle for the trigger area, a solid dot
              for the centre. Green once you've answered it, and the one
              you're heading for pulses. */}
          {zones.map((z) => {
            const done = answeredIds.includes(z.id);
            const queued = queuedIds.includes(z.id);
            const isNext = !done && !queued && z.id === nearestId;
            const color = done ? C.thrust : queued ? C.plasma : C.ion;
            return (
              <React.Fragment key={z.id}>
                <Circle
                  center={[z.lat, z.lng]}
                  radius={z.radiusM}
                  pathOptions={{
                    color, weight: 1, opacity: 0.35,
                    fillColor: color, fillOpacity: done ? 0.14 : 0.07,
                    className: isNext ? "nc-next" : undefined,
                  }}
                />
                <CircleMarker
                  center={[z.lat, z.lng]}
                  radius={done ? 6 : 5}
                  pathOptions={{
                    color, weight: done ? 3 : 2,
                    fillColor: color, fillOpacity: done ? 1 : 0.5,
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* You */}
          {pos && carIcon && <Marker position={[pos.lat, pos.lng]} icon={carIcon} />}
        </MapContainer>
      </div>
    </>
  );
}
