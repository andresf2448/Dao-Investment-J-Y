import { formatUnits } from "viem";

export const DEFAULT_TOKEN_DECIMALS = 18;

export function formatExactTokenAmount(
  value: bigint,
  decimals: number,
  symbol?: string,
): string {
  const exactAmount = formatUnits(value, decimals);
  const normalizedAmount = exactAmount.includes(".")
    ? exactAmount.replace(/\.?0+$/, "")
    : exactAmount;

  return symbol ? `${normalizedAmount} ${symbol}` : normalizedAmount;
}

export function normalizeTokenDecimals(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}
