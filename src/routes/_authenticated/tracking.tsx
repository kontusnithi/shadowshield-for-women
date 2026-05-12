import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ZoneMap, type MapZone } from "@/components/ZoneMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Crosshair } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tracking")({
  head: () => ({ meta: [{ title: "Live Tracking · ShadowShield+" }] }),
  component: Tracking,
});

function Tracking() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [trail, setTrail] = useState<{ lat: number; lng: number }[]>([]);
  const [zones, setZones] = useState<MapZone[]>([]);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    supabase.from("safety_zones").select("*").then(({ data }) => data && setZones(data as MapZone[]));
    supabase.from("location_pings").select("lat,lng").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data) setTrail(data.reverse() as any);
      });
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 12.9716, lng: 77.5946 }),
      );
    }
  }, []);

  useEffect(() => {
    if (!tracking) return;
    let userId: string | null = null;
    supabase.auth.getUser().then(({ data }) => { userId = data.user?.id ?? null; });
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(next);
        setTrail((prev) => [...prev.slice(-200), next]);
        if (userId) await supabase.from("location_pings").insert({ user_id: userId, ...next, accuracy: pos.coords.accuracy });
      },
      (err) => toast.error(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [tracking]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display">Live Tracking</h1>
          <p className="text-sm text-muted-foreground">Your route is privately stored and only shared during escalations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tracking ? "destructive" : "default"} onClick={() => setTracking(!tracking)} className={tracking ? "" : "glow"}>
            <Crosshair className="h-4 w-4 mr-2" />
            {tracking ? "Stop tracking" : "Start tracking"}
          </Button>
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> Route &amp; safety zones</CardTitle>
        </CardHeader>
        <CardContent>
          {coords ? (
            <ZoneMap center={coords} trail={trail} zones={zones} height={520} />
          ) : (
            <div className="text-sm text-muted-foreground p-8 text-center">Acquiring location…</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
