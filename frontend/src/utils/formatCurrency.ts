import { formatUnits } from "viem";

const TOKEN_SYMBOLS: Record<string, string> = {
  ETH: "ETH",
  WETH: "WETH",
  USDC: "USDC",
  USDT: "USDT",
  DAI: "DAI",
  GOV: "GOV",
};

export function formatCurrency(
  value: string | number,
  symbol: string = "USD",
  decimals: number = 2
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";

  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${formatted} ${symbol}`;
}

export function formatTokenAmount(
  value: string | number | bigint,
  symbol?: string,
  decimals: number = 18,
): string {
  const formattedValue =
    typeof value === "bigint"
      ? formatUnits(value, decimals)
      : typeof value === "string"
        ? value
        : String(value);

  const num = parseFloat(formattedValue);
  if (isNaN(num)) return "—";

  const displayDecimals = num < 1 ? 6 : 2;
  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: displayDecimals,
    maximumFractionDigits: displayDecimals,
  });

  return symbol ? `${formatted} ${symbol}` : formatted;
}

export function parseTokenAmount(value: string, decimals: number = 18): bigint {
  const num = parseFloat(value);
  if (isNaN(num)) return BigInt(0);
  return BigInt(Math.floor(num * Math.pow(10, decimals)));
}
