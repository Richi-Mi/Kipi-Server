export type AgeMode = "child" | "teen";

export function parseAgeMode(value: unknown): AgeMode | null {
  if (value === "child" || value === "teen") {
    return value;
  }
  return null;
}
