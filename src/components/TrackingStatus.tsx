import { Shield, MapPin, Activity } from "lucide-react";

export default function TrackingStatus() {
  return (
    <div className="max-w-5xl mx-auto mt-10 grid md:grid-cols-3 gap-6 px-6">

      <div className="glass rounded-2xl p-6 border border-border/40">
        <Shield className="text-primary mb-3" />
        <h3 className="text-xl font-semibold">
          Protection Status
        </h3>
        <p className="text-green-400 mt-2">
          Active
        </p>
      </div>

      <div className="glass rounded-2xl p-6 border border-border/40">
        <MapPin className="text-accent mb-3" />
        <h3 className="text-xl font-semibold">
          Live Tracking
        </h3>
        <p className="text-muted-foreground mt-2">
          Monitoring enabled
        </p>
      </div>

      <div className="glass rounded-2xl p-6 border border-border/40">
        <Activity className="text-pink-400 mb-3" />
        <h3 className="text-xl font-semibold">
          Risk Analysis
        </h3>
        <p className="text-yellow-400 mt-2">
          Low Risk
        </p>
      </div>

    </div>
  );
}