import { useEffect, useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SosButtonProps {
  onTrigger: () => void;
  /** Hold duration in ms before firing */
  holdMs?: number;
  size?: "lg" | "xl";
}

export function SosButton({ onTrigger, holdMs = 1200, size = "xl" }: SosButtonProps) {
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!pressing) {
      setProgress(0);
      return;
    }
    const start = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / holdMs);
      setProgress(p);
      if (p >= 1) {
        onTrigger();
        setPressing(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pressing, holdMs, onTrigger]);

  const dim = size === "xl" ? "h-44 w-44" : "h-32 w-32";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onMouseDown={() => setPressing(true)}
        onMouseUp={() => setPressing(false)}
        onMouseLeave={() => setPressing(false)}
        onTouchStart={() => setPressing(true)}
        onTouchEnd={() => setPressing(false)}
        className={cn(
          "relative rounded-full flex items-center justify-center select-none transition-transform",
          "bg-gradient-to-br from-[oklch(0.65_0.25_25)] to-[oklch(0.55_0.27_15)]",
          "text-white font-bold uppercase tracking-widest pulse-ring glow-danger",
          pressing && "scale-95",
          dim,
        )}
        aria-label="Hold to trigger SOS"
      >
        <div className="flex flex-col items-center gap-1">
          <AlertTriangle className="h-8 w-8" />
          <span className="text-lg">SOS</span>
          <span className="text-[10px] opacity-80">HOLD</span>
        </div>
        {progress > 0 && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" stroke="white" strokeWidth="3" fill="none"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={(1 - progress) * 2 * Math.PI * 46}
              opacity={0.9} />
          </svg>
        )}
      </button>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Shield className="h-3 w-3" /> Press &amp; hold {holdMs / 1000}s to escalate
      </p>
    </div>
  );
}
