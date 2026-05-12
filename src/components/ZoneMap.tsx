import { useEffect, useState } from "react";
import type { ZoneLevel } from "@/lib/risk-engine";

export interface MapZone {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  level: ZoneLevel;
}

interface ZoneMapProps {
  center: { lat: number; lng: number };
  trail?: { lat: number; lng: number }[];
  zones?: MapZone[];
  height?: number;
}

const zoneColor: Record<ZoneLevel, string> = {
  safe: "oklch(0.78 0.16 155)",
  medium: "oklch(0.82 0.18 80)",
  high: "oklch(0.7 0.22 30)",
  extreme: "oklch(0.6 0.27 15)",
};

export function ZoneMap({ center, trail = [], zones = [], height = 420 }: ZoneMapProps) {
  const [Mod, setMod] = useState<any>(null);

  useEffect(() => {
    let active = true;
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, L]) => {
      if (!active) return;
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setMod({ rl, L });
    });
    return () => { active = false; };
  }, []);

  if (!Mod) {
    return (
      <div className="glass rounded-xl flex items-center justify-center text-sm text-muted-foreground"
           style={{ height }}>
        Loading map…
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Circle, Polyline, Popup } = Mod.rl;

  return (
    <div className="overflow-hidden rounded-xl glass" style={{ height }}>
      <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {zones.map((z) => (
          <Circle
            key={z.id}
            center={[z.center_lat, z.center_lng]}
            radius={z.radius_m}
            pathOptions={{ color: zoneColor[z.level], fillColor: zoneColor[z.level], fillOpacity: 0.18, weight: 2 }}
          >
            <Popup><b>{z.name}</b><br />Risk: {z.level}</Popup>
          </Circle>
        ))}
        {trail.length > 1 && (
          <Polyline positions={trail.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "oklch(0.78 0.18 200)", weight: 4, opacity: 0.9 }} />
        )}
        <Marker position={[center.lat, center.lng]}>
          <Popup>You are here</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
