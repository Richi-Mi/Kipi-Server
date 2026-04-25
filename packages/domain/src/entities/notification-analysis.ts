import type { RiskLevel } from "../value-objects/risk-level.js";

export interface NotificationAnalysis {
  readonly riskLevel: RiskLevel;
  readonly confidenceScore: number;
  readonly sensitiveDataFlag: boolean;
  readonly minorFacingMessage: string;
}

export interface NotificationProcessingOutcome {
  readonly analysis: NotificationAnalysis;
  readonly escalatedToParent: boolean;
  readonly escalationReason: string;
}
