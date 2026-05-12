// ShadowShield+ Risk Scoring Engine
// Pure functions — safe to call from client or server.
// Beginner-friendly: each factor returns 0..max and we sum them up.

export type ZoneLevel = "safe" | "medium" | "high" | "extreme";

export interface RiskInputs {
  /** Local hour 0-23 */
  hour: number;
  /** Crowd density 0..1 (1 = very crowded). Mocked in v1. */
  crowdDensity: number;
  /** Number of repeated similar routes in past week */
  routeRepeats: number;
  /** Whether user pressed panic / phrase / shake */
  panicTriggered: boolean;
  /** AI panic probability 0..1 (optional) */
  panicAiScore?: number;
  /** Same device/person follows after >2 turns. v1 placeholder. */
  routeMirroring: boolean;
  /** Current zone level */
  zone: ZoneLevel;
  /** User sensitivity 0..100, scales the final score */
  sensitivity: number;
  /** Night Guardian mode boost */
  nightGuardian: boolean;
}

export interface FactorBreakdown {
  time: number;
  isolation: number;
  tracking: number;
  panic: number;
  mirroring: number;
  zone: number;
}

export interface RiskResult {
  score: number; // 0..100
  factors: FactorBreakdown;
  stage: 0 | 1 | 2 | 3 | 4;
  label: "calm" | "watchful" | "alert" | "danger" | "critical";
}

// --- Individual factor calculators -----------------------------------------

export function timeFactor(hour: number): number {
  // Peak risk 22:00 - 05:00. Daytime is low.
  if (hour >= 22 || hour < 5) return 25;
  if (hour >= 20 || hour < 6) return 18;
  if (hour >= 18 || hour < 7) return 10;
  return 3;
}

export function isolationFactor(crowd: number, zone: ZoneLevel): number {
  // crowd 1 -> 0, crowd 0 -> 25
  const base = Math.round((1 - Math.max(0, Math.min(1, crowd))) * 22);
  const zoneBoost = zone === "extreme" ? 5 : zone === "high" ? 3 : 0;
  return Math.min(25, base + zoneBoost);
}

export function trackingFactor(repeats: number): number {
  if (repeats <= 0) return 0;
  return Math.min(15, repeats * 3);
}

export function panicFactor(triggered: boolean, ai = 0): number {
  const manual = triggered ? 14 : 0;
  const aiPart = Math.round(Math.max(0, Math.min(1, ai)) * 8);
  return Math.min(20, manual + aiPart);
}

export function mirroringFactor(mirroring: boolean): number {
  return mirroring ? 15 : 0;
}

export function zoneFactor(zone: ZoneLevel): number {
  return { safe: 0, medium: 4, high: 7, extreme: 10 }[zone];
}

// --- Aggregator ------------------------------------------------------------

export function computeRisk(input: RiskInputs): RiskResult {
  const factors: FactorBreakdown = {
    time: timeFactor(input.hour),
    isolation: isolationFactor(input.crowdDensity, input.zone),
    tracking: trackingFactor(input.routeRepeats),
    panic: panicFactor(input.panicTriggered, input.panicAiScore),
    mirroring: mirroringFactor(input.routeMirroring),
    zone: zoneFactor(input.zone),
  };

  let raw =
    factors.time +
    factors.isolation +
    factors.tracking +
    factors.panic +
    factors.mirroring +
    factors.zone;

  // Apply sensitivity (50 = neutral, 100 = +30%, 0 = -30%)
  const sensitivityMultiplier = 0.7 + (input.sensitivity / 100) * 0.6;
  raw = raw * sensitivityMultiplier;

  // Night guardian boost during night hours
  if (input.nightGuardian && (input.hour >= 21 || input.hour < 6)) raw *= 1.1;

  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const stage = scoreToStage(score);
  const label = scoreToLabel(score);
  return { score, factors, stage, label };
}

export function scoreToStage(score: number): RiskResult["stage"] {
  if (score >= 95) return 4;
  if (score >= 80) return 3;
  if (score >= 60) return 2;
  if (score >= 40) return 1;
  return 0;
}

export function scoreToLabel(score: number): RiskResult["label"] {
  if (score >= 95) return "critical";
  if (score >= 80) return "danger";
  if (score >= 60) return "alert";
  if (score >= 40) return "watchful";
  return "calm";
}

export function stageDescription(stage: RiskResult["stage"]): string {
  return [
    "All clear — passive monitoring only.",
    'Safety check: confirm "Are you safe?"',
    "Auto-call user (simulated).",
    "Notifying trusted contacts with live location.",
    "Critical: alerting nearest emergency service.",
  ][stage];
}

// Distance helper (Haversine, meters)
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sa));
}

export function classifyZone(
  point: { lat: number; lng: number },
  zones: { center_lat: number; center_lng: number; radius_m: number; level: ZoneLevel }[],
): { level: ZoneLevel; matched: boolean } {
  let worst: ZoneLevel = "safe";
  let matched = false;
  const order: Record<ZoneLevel, number> = { safe: 0, medium: 1, high: 2, extreme: 3 };
  for (const z of zones) {
    const d = distanceMeters(point, { lat: z.center_lat, lng: z.center_lng });
    if (d <= z.radius_m && order[z.level] > order[worst]) {
      worst = z.level;
      matched = true;
    }
  }
  return { level: worst, matched };
}
