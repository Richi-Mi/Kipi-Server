export type PairingSessionStatus = "pending" | "paired" | "expired" | "revoked";

export interface PairingCodeIssued {
  readonly sessionId: string;
  readonly otp: string;
  readonly expiresAtIso: string;
}

export interface PairingConfirmationResult {
  readonly minorId: string;
  readonly message: string;
}
