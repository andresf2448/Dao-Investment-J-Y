import { formatUnits } from "viem";

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
