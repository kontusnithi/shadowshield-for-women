import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/logs")({
  head: () => ({ meta: [{ title: "Emergency Logs · ShadowShield+" }] }),
  component: LogsPage,
});

interface Esc { id: string; stage: string; action: string; status: string; created_at: string; details: any }
interface RE { id: string; score: number; stage: string | null; created_at: string; lat: number | null; lng: number | null; note: string | null }

function LogsPage() {
  const [escs, setEscs] = useState<Esc[]>([]);
  const [events, setEvents] = useState<RE[]>([]);

  useEffect(() => {
    supabase.from("escalations").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setEscs((data as Esc[]) ?? []));
    supabase.from("risk_events").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setEvents((data as RE[]) ?? []));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-display">Emergency Logs</h1>
        <p className="text-sm text-muted-foreground">Every risk threshold and escalation, time-stamped and immutable.</p>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-4 w-4 text-accent" /> Escalation timeline</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {escs.length === 0 && <p className="text-sm text-muted-foreground">No escalations yet.</p>}
          {escs.map((e) => (
            <div key={e.id} className="flex items-center justify-between border border-border/40 rounded-lg p-3">
              <div>
                <div className="font-medium text-sm">{e.action}</div>
                <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{e.stage.replace("_", " ")}</Badge>
                <Badge>{e.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle>Risk events</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 && <p className="text-sm text-muted-foreground">No risk events recorded yet.</p>}
          {events.map((r) => (
            <div key={r.id} className="flex items-center justify-between border border-border/40 rounded-lg p-3">
              <div>
                <div className="text-sm">Score <b className="font-mono">{r.score}</b> {r.note && <span className="text-muted-foreground">· {r.note}</span>}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              {r.stage && <Badge variant="outline">{r.stage.replace("_", " ")}</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
