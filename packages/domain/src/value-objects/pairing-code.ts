/** Alphabet without ambiguous glyphs (O/0/I/1) for human-readable codes. */
export const PAIRING_OTP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" as const;

export function normalizePairingCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidPairingCodeFormat(code: string): boolean {
  if (code.length !== 6) {
    return false;
  }
  return [...code].every((c) => PAIRING_OTP_ALPHABET.includes(c));
}
