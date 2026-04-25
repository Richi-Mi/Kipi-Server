import type { RiskLevel } from "../value-objects/risk-level.js";

export interface EscalationDecision {
  readonly escalatedToParent: boolean;
  readonly reason: string;
}

/**
 * Decides whether a classified risk should surface to the parent,
 * given the minor's agreed disclosure levels.
 *
 * Rule set (product intent):
 * - Level 3 is always escalated (critical).
 * - Otherwise escalate when the risk level is included in `sharedLevels`.
 */
export function decideEscalationToParent(
  riskLevel: RiskLevel,
  sharedLevels: readonly number[],
): EscalationDecision {
  const normalizedShared = sharedLevels.filter(
    (n): n is RiskLevel =>
      typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 3,
  );

  if (riskLevel === 3) {
    return {
      escalatedToParent: true,
      reason:
        "Riesgo crítico (nivel 3): escalamiento obligatorio al padre o tutor, independientemente del acuerdo de privacidad.",
    };
  }

  const escalated = normalizedShared.includes(riskLevel);

  if (escalated) {
    return {
      escalatedToParent: true,
      reason: `El nivel de riesgo (${riskLevel}) está incluido en los niveles acordados para compartir con el padre o tutor: [${normalizedShared.join(", ")}].`,
    };
  }

  const sharedLabel =
    normalizedShared.length > 0 ? normalizedShared.join(", ") : "ninguno";

  return {
    escalatedToParent: false,
    reason: `El nivel de riesgo (${riskLevel}) no está entre los niveles compartidos con el padre o tutor (${sharedLabel}), o no supera el umbral acordado.`,
  };
}
