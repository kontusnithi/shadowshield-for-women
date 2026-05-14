import LocationTracker from "@/components/LocationTracker";
import LiveMap from "@/components/LiveMap";
import TrackingStatus from "@/components/TrackingStatus";
import RiskStatusCard from "@/components/RiskStatusCard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Shield, Brain, Radar, MapPin, Zap, Lock, Bell, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShadowShield+ — Predictive AI safety for women" },
      { name: "description", content: "Adaptive AI risk scoring, shadow detection, and multi-stage emergency escalation. Built to minimize false alarms and act exactly when it matters." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Brain, title: "AI Risk Scoring", desc: "Time, isolation, route patterns, and panic signals fuse into a single live risk score." },
  { icon: Radar, title: "Shadow Detection", desc: "Spots suspicious following behavior across turns and routes — without crying wolf." },
  { icon: Zap, title: "Multi-stage Escalation", desc: "From silent check-in to trusted contacts to emergency dispatch — adaptive, not all-or-nothing." },
  { icon: MapPin, title: "Dynamic Safety Zones", desc: "Sensitivity ramps up automatically in isolated, high-risk, or unfamiliar areas." },
  { icon: Lock, title: "Silent SOS", desc: "Trigger help by shake, secret phrase, or a hidden pattern — no obvious panic press." },
  { icon: Bell, title: "Trusted Contacts", desc: "Your circle gets live location, route history, and battery status when it matters." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 glass border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center glow">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg">ShadowShield<span className="text-accent">+</span></span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
            <Button asChild size="sm">
              <Link to="/login">Get protected</Link>
            </Button>
          </nav>
        </div>
      </header>
      
      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-accent border border-accent/30 rounded-full px-3 py-1">
            <Activity className="h-3 w-3" /> Adaptive · Predictive · Quiet
          </span>
          <h1 className="mt-6 text-5xl md:text-7xl font-display leading-[1.05]">
            Safety that thinks <span className="text-gradient">before</span> it shouts.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            ShadowShield+ blends time, isolation, panic signals, and route behavior into a real-time
            risk score — escalating help only when it's truly needed.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="glow">
              <Link to="/login">Activate ShadowShield+</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#features">Explore features</a>
            </Button>
          </div>
        </motion.div>
        <TrackingStatus />
        <RiskStatusCard />

        {/* Score preview card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-16 mx-auto max-w-3xl glass rounded-2xl p-6 grid sm:grid-cols-3 gap-6"
        >
          <Stat label="Live risk score" value="62" hint="Stage 2 · Alert" color="var(--warn)" />
          <Stat label="Zone" value="High" hint="Industrial backroad" color="var(--danger)" />
          <Stat label="Night Guardian" value="ON" hint="22:48 local" color="var(--accent)" />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display">Built for the moments that matter.</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Smart enough to stay quiet during your daily commute. Loud enough when something is wrong.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-6"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary grid place-items-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="glass rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-display">Your shadow, watched.</h2>
          <p className="mt-3 text-muted-foreground">
            Sign in to activate adaptive monitoring, configure trusted contacts, and view your live risk dashboard.
          </p>
          <Button asChild size="lg" className="mt-6 glow">
            <Link to="/login">Create free account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        ShadowShield+ · A demonstration safety platform · Simulated SMS &amp; emergency dispatch in this build.
      </footer>
    </div>
  );
}

function Stat({ label, value, hint, color }: { label: string; value: string; hint: string; color: string }) {
  return (
    <div className="text-left">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono text-4xl mt-1" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}
