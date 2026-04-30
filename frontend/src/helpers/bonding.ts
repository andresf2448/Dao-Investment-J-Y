import { parseUnits } from "viem";

export function calculateEstimatedTokens(amount: string, rate: number): string {
  const numericAmount = parseFloat(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) return "0.00";

  const result = numericAmount * rate;

  return result.toFixed(2);
}

export function parseBondingTokenAmount(
  amount: string,
  decimals: number = 18,
): bigint | null {
  const normalizedAmount = amount.trim();

  if (!normalizedAmount) {
    return null;
  }

  try {
    const parsedAmount = parseUnits(normalizedAmount, decimals);
    return parsedAmount > 0n ? parsedAmount : null;
  } catch {
    return null;
  }
}
