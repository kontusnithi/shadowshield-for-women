import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, MapPin, Moon, Phone, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskRing } from "@/components/RiskRing";
import { SosButton } from "@/components/SosButton";
import { computeRisk, classifyZone, stageDescription, type ZoneLevel } from "@/lib/risk-engine";
import { classifyPanicText } from "@/lib/safety.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · ShadowShield+" }] }),
  component: Dashboard,
});

interface Zone { id: string; name: string; center_lat: number; center_lng: number; radius_m: number; level: ZoneLevel }

function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [profile, setProfile] = useState<{ night_guardian: boolean; sensitivity: number; full_name: string | null } | null>(null);
  const [contactCount, setContactCount] = useState(0);
  const [panicTriggered, setPanicTriggered] = useState(false);
  const [panicAi, setPanicAi] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [classifying, setClassifying] = useState(false);
  const classify = useServerFn(classifyPanicText);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    supabase.from("safety_zones").select("*").then(({ data }) => { if (data) setZones(data as Zone[]); });
    supabase.from("profiles").select("full_name,night_guardian,sensitivity").maybeSingle().then(({ data }) => {
      if (data) setProfile(data);
    });
    supabase.from("trusted_contacts").select("id", { count: "exact", head: true }).then(({ count }) => setContactCount(count ?? 0));
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 12.9716, lng: 77.5946 }),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    } else setCoords({ lat: 12.9716, lng: 77.5946 });
  }, []);

  const hour = new Date().getHours();
  const zoneInfo = useMemo(() => coords ? classifyZone(coords, zones) : { level: "safe" as ZoneLevel, matched: false }, [coords, zones]);

  const risk = useMemo(() => computeRisk({
    hour,
    crowdDensity: zoneInfo.level === "extreme" ? 0.05 : zoneInfo.level === "high" ? 0.2 : zoneInfo.level === "medium" ? 0.5 : 0.85,
    routeRepeats: 0,
    panicTriggered,
    panicAiScore: panicAi,
    routeMirroring: false,
    zone: zoneInfo.level,
    sensitivity: profile?.sensitivity ?? 50,
    nightGuardian: profile?.night_guardian ?? true,
  }), [hour, zoneInfo, panicTriggered, panicAi, profile]);

  useEffect(() => {
    if (!coords || !userId || risk.stage === 0) return;
    supabase.from("risk_events").insert({
      user_id: userId,
      score: risk.score,
      factors: risk.factors as any,
      stage: `stage_${risk.stage}` as any,
      lat: coords.lat,
      lng: coords.lng,
    });
  }, [risk.stage]); // eslint-disable-line

  const triggerSos = useCallback(async () => {
    if (!userId) return;
    setPanicTriggered(true);
    toast.error("SOS triggered — escalating", { description: stageDescription(4) });
    const { data: contacts } = await supabase.from("trusted_contacts").select("name,phone").order("priority");
    const { data: re } = await supabase.from("risk_events").insert({
      user_id: userId, score: 100, factors: { manual_sos: true } as any,
      stage: "stage_4", lat: coords?.lat, lng: coords?.lng, note: "Manual SOS",
    }).select().single();
    const stages = [
      { stage: "stage_1" as const, action: "Safety check sent to user" },
      { stage: "stage_2" as const, action: "Auto-call user (simulated)" },
      { stage: "stage_3" as const, action: `Notified ${contacts?.length ?? 0} trusted contact(s) with location` },
      { stage: "stage_4" as const, action: "Alerted nearest emergency service (simulated)" },
    ];
    for (const s of stages) {
      await supabase.from("escalations").insert({
        user_id: userId, risk_event_id: re?.id, stage: s.stage, action: s.action, status: "sent",
        details: { lat: coords?.lat, lng: coords?.lng, contacts: contacts?.length ?? 0 } as any,
      });
    }
    setTimeout(() => setPanicTriggered(false), 8000);
  }, [coords, userId]);

  const runClassify = async () => {
    if (!transcript.trim()) return;
    setClassifying(true);
    try {
      const res = await classify({ data: { text: transcript } });
      setPanicAi(res.score ?? 0);
      if (res.error) toast.error(res.error);
      else toast.success(`AI panic likelihood: ${(res.score * 100).toFixed(0)}%`);
    } catch (e: any) {
      toast.error(e?.message ?? "Classification failed");
    } finally { setClassifying(false); }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}</p>
          <h1 className="text-3xl font-display">Live Safety Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3 w-3 text-accent animate-pulse" /> Adaptive monitoring active · {hour}:00 local
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass">
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Real-time Risk</CardTitle></CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-8">
            <RiskRing score={risk.score} label={risk.label} />
            <div className="flex-1 space-y-3">
              <div className="text-sm text-muted-foreground">Stage {risk.stage} · {stageDescription(risk.stage)}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(risk.factors).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border/50 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
                    <div className="font-mono text-xl">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass flex flex-col items-center justify-center p-6">
          <SosButton onTrigger={triggerSos} />
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StatusCard icon={MapPin} label="Current zone" value={zoneInfo.level} accent={zoneInfo.level} />
        <StatusCard icon={Moon} label="Night guardian" value={profile?.night_guardian ? "Active" : "Off"} accent={profile?.night_guardian ? "safe" : "medium"} />
        <StatusCard icon={Phone} label="Trusted contacts" value={String(contactCount)} accent={contactCount > 0 ? "safe" : "high"} />
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> AI Panic Detection</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Type what's happening. The AI estimates distress likelihood and folds it into your live risk score.</p>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)}
            placeholder='Try: "Someone has been walking behind me for 15 minutes..."'
            className="w-full min-h-24 rounded-lg bg-input/30 border border-border/60 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <div className="flex items-center gap-3">
            <Button onClick={runClassify} disabled={classifying || !transcript.trim()}>
              {classifying ? "Analyzing…" : "Analyze with AI"}
            </Button>
            {panicAi > 0 && <span className="text-sm text-muted-foreground">Panic likelihood: <b className="text-foreground">{(panicAi * 100).toFixed(0)}%</b></span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  const colorMap: Record<string, string> = {
    safe: "text-[oklch(0.78_0.16_155)]",
    medium: "text-[oklch(0.82_0.18_80)]",
    high: "text-[oklch(0.7_0.22_30)]",
    extreme: "text-[oklch(0.6_0.27_15)]",
  };
  return (
    <Card className="glass">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted/30 grid place-items-center"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className={`font-mono text-xl uppercase ${colorMap[accent] ?? ""}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
