import type { MinorDashboardSlice } from "../entities/alert.js";
import type {
  PairingCodeIssued,
  PairingConfirmationResult,
} from "../entities/pairing.js";
import type { NotificationProcessingOutcome } from "../entities/notification-analysis.js";
import type { RiskLevel } from "../value-objects/risk-level.js";

export interface DashboardQuery {
  readonly parentId: string;
  readonly accessToken: string;
}

export interface PairingGenerateInput {
  readonly deviceModel: string | null;
  readonly fcmPushToken: string | null;
}

export interface PairingConfirmInput {
  readonly parentId: string;
  readonly otp: string;
  readonly accessToken: string;
}

export interface NotificationAnalyzeInput {
  readonly minorId: string;
  readonly appSource: string;
  readonly textPreview: string;
}

export interface ManualAlertInput {
  readonly minorId: string;
  readonly description: string;
  readonly appSource: string;
  readonly riskLevel: RiskLevel;
}

export interface ManualAlertResult {
  readonly alertId: string;
  readonly message: string;
}

/**
 * Application boundary ports. Infra (Supabase, HTTP, Gemini) implements these.
 */
export interface ParentDashboardPort {
  loadDashboard(query: DashboardQuery): Promise<readonly MinorDashboardSlice[]>;
}

export interface PairingPort {
  issueCode(input: PairingGenerateInput): Promise<PairingCodeIssued>;
  confirmCode(input: PairingConfirmInput): Promise<PairingConfirmationResult>;
}

export interface NotificationClassificationPort {
  analyze(input: NotificationAnalyzeInput): Promise<NotificationProcessingOutcome>;
}

export interface ManualAlertsPort {
  create(input: ManualAlertInput): Promise<ManualAlertResult>;
}
