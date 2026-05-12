import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "AI Analytics · ShadowShield+" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("risk_events").select("*").order("created_at", { ascending: true }).limit(200)
      .then(({ data }) => setEvents(data ?? []));
  }, []);

  const series = useMemo(() => events.map((e) => ({
    t: new Date(e.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    score: Number(e.score),
  })), [events]);

  const factorTotals = useMemo(() => {
    const totals: Record<string, number> = { time: 0, isolation: 0, tracking: 0, panic: 0, mirroring: 0, zone: 0 };
    for (const e of events) {
      const f = e.factors || {};
      for (const k of Object.keys(totals)) totals[k] += Number(f[k] ?? 0);
    }
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [events]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-display">AI Risk Analytics</h1>
        <p className="text-sm text-muted-foreground">Trends across your monitored sessions.</p>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Risk score over time</CardTitle></CardHeader>
        <CardContent style={{ height: 320 }}>
          {series.length === 0 ? (
            <div className="text-sm text-muted-foreground p-8">No data yet — start a tracking session.</div>
          ) : (
            <ResponsiveContainer>
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="gscore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.22 295)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="oklch(0.7 0.22 295)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.3 0.03 270 / 0.3)" />
                <XAxis dataKey="t" stroke="oklch(0.7 0.03 260)" />
                <YAxis domain={[0, 100]} stroke="oklch(0.7 0.03 260)" />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.03 268)", border: "1px solid oklch(0.3 0.03 270)" }} />
                <Area type="monotone" dataKey="score" stroke="oklch(0.7 0.22 295)" fill="url(#gscore)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle>Cumulative factor contribution</CardTitle></CardHeader>
        <CardContent style={{ height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={factorTotals}>
              <CartesianGrid stroke="oklch(0.3 0.03 270 / 0.3)" />
              <XAxis dataKey="name" stroke="oklch(0.7 0.03 260)" />
              <YAxis stroke="oklch(0.7 0.03 260)" />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.03 268)", border: "1px solid oklch(0.3 0.03 270)" }} />
              <Bar dataKey="value" fill="oklch(0.78 0.18 200)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
