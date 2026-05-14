import { calculateRiskScore } from "@/lib/riskEngine";

export default function RiskStatusCard() {

  const currentHour = new Date().getHours();

  const risk = calculateRiskScore(
    currentHour,
    true,
    false
  );

  return (
    <div className="glass rounded-2xl p-6 mt-8 border border-border/40">

      <h2 className="text-2xl font-bold mb-4">
        AI Risk Analysis
      </h2>

      <div className="flex items-center justify-between">

        <p className="text-lg">
          Current Threat Level
        </p>

        <span
          className={`px-4 py-2 rounded-full font-bold bg-${risk.color}-500`}
        >
          {risk.level}
        </span>

      </div>

    </div>
  );
}