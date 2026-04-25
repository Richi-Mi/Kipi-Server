import type { AgeMode } from "../value-objects/age-mode.js";
import type { RiskLevel } from "../value-objects/risk-level.js";

export interface MinorProfile {
  readonly id: string;
  readonly parentId: string;
  readonly displayName: string;
  readonly ageMode: AgeMode;
  /** Risk levels (1–3) the minor agreed can be shown to the parent. */
  readonly sharedAlertLevels: readonly RiskLevel[];
}
