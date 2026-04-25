const LEVELS = [1, 2, 3] as const;

export type RiskLevel = (typeof LEVELS)[number];

export function parseRiskLevel(value: unknown): RiskLevel | null {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null;
  }
  return (LEVELS as readonly number[]).includes(value) ? (value as RiskLevel) : null;
}

export function assertRiskLevel(value: unknown): RiskLevel {
  const parsed = parseRiskLevel(value);
  if (parsed === null) {
    throw new TypeError("risk_level must be an integer in {1,2,3}");
  }
  return parsed;
}
