import type { RiskLevel } from "../value-objects/risk-level.js";

export interface ParentalAssistantHint {
  readonly contextualGuide: string;
  readonly resources: readonly string[];
}

export interface AlertFeedItem {
  readonly id: string;
  readonly appSource: string;
  readonly riskLevel: RiskLevel;
  readonly sensitiveDataFlag: boolean;
  readonly createdAtIso: string;
  readonly parentalAssistant?: ParentalAssistantHint;
}

export interface MinorAlertStats {
  readonly level2Count: number;
  readonly level3Count: number;
}

export interface MinorDashboardSlice {
  readonly minorId: string;
  readonly name: string;
  readonly ageMode: string;
  readonly sharedAlertLevels: readonly number[];
  readonly stats: MinorAlertStats;
  readonly recentAlerts: readonly AlertFeedItem[];
}
