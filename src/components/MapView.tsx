"use client";

import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  type GeoJSONSource,
} from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

// OpenFreeMap: anahtarsız ve ücretsiz. Atıf (OpenStreetMap, OpenFreeMap) harita üzerinde kendiliğinden görünür.
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const EMPTY_LINE = {
  type: "Feature" as const,
  properties: {},
  geometry: { type: "LineString" as const, coordinates: [] as [number, number][] },
};

export type MapMarker = {
  id: string;
  lng: number;
  lat: number;
  color: string;
  title: string;
};

export type MapViewProps = {
  markers: MapMarker[];
  path?: [number, number][] | null;
  onMapClick?: (point: { lat: number; lng: number }) => void;
  className?: string;
  label: string;
};

// markers ve path değerleri üst bileşende useMemo ile sabit tutulmalı (her çizimde yeni dizi vermeyin).
export default function MapView({
  markers,
  path = null,
  onMapClick,
  className = "h-72 w-full rounded-2xl",
  label,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Marker[]>([]);
  const clickRef = useRef<MapViewProps["onMapClick"]>(onMapClick);
  const [loadedMap, setLoadedMap] = useState<MapLibreMap | null>(null);

  useEffect(() => {
    clickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    // Harita stil dosyası (public klasöründen), yalnızca harita açıldığında yüklenir.
    if (!document.getElementById("maplibre-css")) {
      const link = document.createElement("link");
      link.id = "maplibre-css";
      link.rel = "stylesheet";
      link.href = "/maplibre-gl.css";
      document.head.appendChild(link);
    }

    const container = containerRef.current;

    if (!container) {
      return;
    }

    const map = new MapLibreMap({
      container,
      style: STYLE_URL,
      center: [35.2, 39.0],
      zoom: 5,
      attributionControl: { compact: true },
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.resize();
      map.addSource("route", { type: "geojson", data: EMPTY_LINE });
      map.addLayer({
        id: "route-solid",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round", visibility: "none" },
        paint: {
          "line-color": "#6c4dff",
          "line-width": 5,
          "line-opacity": 0.85,
        },
      });
      map.addLayer({
        id: "route-dashed",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round", visibility: "none" },
        paint: {
          "line-color": "#6c4dff",
          "line-width": 4,
          "line-dasharray": [2, 2],
        },
      });
      setLoadedMap(map);
    });

    map.on("click", (event) => {
      clickRef.current?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });

    return () => {
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = loadedMap;

    if (!map) {
      return;
    }

    const hasPath = Boolean(path && path.length > 1);
    const straight: [number, number][] = markers.map((m) => [m.lng, m.lat]);
    const line: [number, number][] =
      hasPath && path ? path : straight.length > 1 ? straight : [];

    const source = map.getSource("route") as GeoJSONSource | undefined;
    source?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: line },
    });
    map.setLayoutProperty("route-solid", "visibility", hasPath ? "visible" : "none");
    map.setLayoutProperty(
      "route-dashed",
      "visibility",
      !hasPath && line.length > 1 ? "visible" : "none",
    );

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = markers.map((m) =>
      new Marker({ color: m.color })
        .setLngLat([m.lng, m.lat])
        .setPopup(new Popup({ offset: 24 }).setText(m.title))
        .addTo(map),
    );

    const focus = line.length > 0 ? line : straight;

    if (focus.length === 1) {
      map.easeTo({ center: focus[0], zoom: 14, duration: 0 });
    } else if (focus.length > 1) {
      const bounds = new LngLatBounds(focus[0], focus[0]);
      focus.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 });
    }
  }, [loadedMap, markers, path]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={label}
      className={className}
    />
  );
}