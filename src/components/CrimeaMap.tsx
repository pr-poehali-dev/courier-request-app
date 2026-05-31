/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback } from "react";

interface LatLng {
  lat: number;
  lng: number;
}

interface CrimeaMapProps {
  pointA: LatLng | null;
  pointB: LatLng | null;
  selectingPoint: "A" | "B" | null;
  onMapClick: (latlng: LatLng) => void;
}

// Черноморское, Крым
const CRIMEA_CENTER: [number, number] = [45.5093, 32.6889];
const ZOOM = 9;

export default function CrimeaMap({ pointA, pointB, selectingPoint, onMapClick }: CrimeaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerARef = useRef<any>(null);
  const markerBRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const pointARef = useRef(pointA);
  pointARef.current = pointA;
  const pointBRef = useRef(pointB);
  pointBRef.current = pointB;

  const updateRouteLine = useCallback((pA: LatLng | null, pB: LatLng | null) => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (pA && pB) {
      routeLineRef.current = L.polyline(
        [[pA.lat, pA.lng], [pB.lat, pB.lng]],
        { color: "#FF7A1A", weight: 3, opacity: 0.85, dashArray: "8 6" }
      ).addTo(map);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: CRIMEA_CENTER,
      zoom: ZOOM,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    L.circle(CRIMEA_CENTER, {
      radius: 50000,
      color: "#FF7A1A",
      fillColor: "#FF7A1A",
      fillOpacity: 0.04,
      weight: 1.5,
      dashArray: "6 4",
    }).addTo(map);

    const centerIcon = L.divIcon({
      html: `<div style="width:10px;height:10px;background:#FF7A1A;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(255,122,26,0.8);"></div>`,
      className: "",
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
    L.marker(CRIMEA_CENTER, { icon: centerIcon })
      .addTo(map)
      .bindPopup('<span style="font-family:Golos Text,sans-serif;font-size:13px;color:#fff">📍 Черноморское</span>');

    map.on("click", (e: any) => {
      onMapClickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
   
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.style.cursor = selectingPoint ? "crosshair" : "";
  }, [selectingPoint]);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;
    if (markerARef.current) { map.removeLayer(markerARef.current); markerARef.current = null; }
    if (pointA) {
      const icon = L.divIcon({
        html: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:32px;height:32px;background:#22c55e;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:13px;box-shadow:0 4px 12px rgba(34,197,94,0.5);">А</div><div style="width:2px;height:10px;background:#22c55e;"></div></div>`,
        className: "",
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });
      markerARef.current = L.marker([pointA.lat, pointA.lng], { icon, draggable: true }).addTo(map);
    }
    updateRouteLine(pointA, pointBRef.current);
   
  }, [pointA, updateRouteLine]);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;
    if (markerBRef.current) { map.removeLayer(markerBRef.current); markerBRef.current = null; }
    if (pointB) {
      const icon = L.divIcon({
        html: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:32px;height:32px;background:#3b82f6;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:13px;box-shadow:0 4px 12px rgba(59,130,246,0.5);">Б</div><div style="width:2px;height:10px;background:#3b82f6;"></div></div>`,
        className: "",
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });
      markerBRef.current = L.marker([pointB.lat, pointB.lng], { icon, draggable: true }).addTo(map);
    }
    updateRouteLine(pointARef.current, pointB);
   
  }, [pointB, updateRouteLine]);

  return <div ref={mapRef} style={{ height: 280, width: "100%" }} />;
}
