export const ApiErrorCode = {
  TEXT_TOO_SHORT: "TEXT_TOO_SHORT",
  INVALID_UUID: "INVALID_UUID",
  MODEL_PROVIDER_ERROR: "MODEL_PROVIDER_ERROR",
  MINOR_NOT_FOUND: "MINOR_NOT_FOUND",
  AUTH_REQUIRED: "AUTH_REQUIRED",
  FORBIDDEN: "FORBIDDEN",
  PAIRING_INVALID: "PAIRING_INVALID",
  PAIRING_RATE_LIMIT: "PAIRING_RATE_LIMIT",
  MISSION_NOT_FOUND: "MISSION_NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export const ERROR_HTTP_STATUS: Record<ApiErrorCode, number> = {
  [ApiErrorCode.TEXT_TOO_SHORT]: 422,
  [ApiErrorCode.INVALID_UUID]: 400,
  [ApiErrorCode.MODEL_PROVIDER_ERROR]: 502,
  [ApiErrorCode.MINOR_NOT_FOUND]: 404,
  [ApiErrorCode.AUTH_REQUIRED]: 401,
  [ApiErrorCode.FORBIDDEN]: 403,
  [ApiErrorCode.PAIRING_INVALID]: 400,
  [ApiErrorCode.PAIRING_RATE_LIMIT]: 429,
  [ApiErrorCode.MISSION_NOT_FOUND]: 404,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
};

export class DomainError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
