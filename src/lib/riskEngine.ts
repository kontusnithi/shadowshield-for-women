export function calculateRiskScore(
  hour: number,
  isolatedArea: boolean,
  panicTriggered: boolean
) {
  let score = 20;

  if (hour >= 22 || hour <= 5) {
    score += 30;
  }

  if (isolatedArea) {
    score += 30;
  }

  if (panicTriggered) {
    score += 40;
  }

  if (score >= 80) {
    return {
      level: "CRITICAL",
      color: "red",
    };
  }

  if (score >= 60) {
    return {
      level: "HIGH",
      color: "orange",
    };
  }

  if (score >= 40) {
    return {
      level: "MEDIUM",
      color: "yellow",
    };
  }

  return {
    level: "LOW",
    color: "green",
  };
}