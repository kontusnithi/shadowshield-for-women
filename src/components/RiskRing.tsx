import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RiskRingProps {
  score: number;
  label: string;
  size?: number;
}

export function RiskRing({ score, label, size = 220 }: RiskRingProps) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "var(--extreme)" :
    score >= 60 ? "var(--danger)" :
    score >= 40 ? "var(--warn)" :
    "var(--safe)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--muted)" strokeWidth={10} fill="none" opacity={0.3} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 12px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={cn("font-mono text-5xl font-bold tabular-nums")} style={{ color }}>
          {score}
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
