import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · ShadowShield+" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nightGuardian, setNightGuardian] = useState(true);
  const [sensitivity, setSensitivity] = useState(50);
  const [silentPhrase, setSilentPhrase] = useState("shadow help");
  const [shake, setShake] = useState(25);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("*").maybeSingle().then(({ data }) => {
      if (!data) return;
      setFullName(data.full_name ?? "");
      setPhone(data.phone ?? "");
      setNightGuardian(data.night_guardian);
      setSensitivity(data.sensitivity);
      setSilentPhrase(data.silent_phrase ?? "shadow help");
      setShake(Number(data.shake_threshold ?? 25));
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      phone,
      night_guardian: nightGuardian,
      sensitivity,
      silent_phrase: silentPhrase,
      shake_threshold: shake,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display">Settings</h1>
        <p className="text-sm text-muted-foreground">Tune how ShadowShield+ watches and when it speaks up.</p>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="flex items-center gap-2"><SettingsIcon className="h-4 w-4 text-accent" /> Profile</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle>Adaptive monitoring</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Night Guardian mode</Label>
              <p className="text-xs text-muted-foreground">Boost monitoring sensitivity between 21:00 and 06:00.</p>
            </div>
            <Switch checked={nightGuardian} onCheckedChange={setNightGuardian} />
          </div>
          <div>
            <Label>Risk sensitivity ({sensitivity})</Label>
            <p className="text-xs text-muted-foreground mb-2">Lower = fewer false alarms. Higher = quicker escalation.</p>
            <Slider value={[sensitivity]} min={0} max={100} step={5} onValueChange={(v) => setSensitivity(v[0])} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle>Silent SOS</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Secret voice phrase</Label>
            <Input value={silentPhrase} onChange={(e) => setSilentPhrase(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Speak this to trigger help silently. (Voice listener wires up next iteration.)</p>
          </div>
          <div>
            <Label>Shake threshold ({shake})</Label>
            <Slider value={[shake]} min={5} max={60} step={1} onValueChange={(v) => setShake(v[0])} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="glow">
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
