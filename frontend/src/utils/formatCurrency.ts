import { formatUnits, parseUnits } from "viem";

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

function addThousandsSeparators(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function trimTrailingZeros(value: string): string {
  const trimmed = value.replace(/\.?0+$/, "");
  return trimmed === "" ? "0" : trimmed;
}

export function formatTokenAmountFloor(
  value: bigint,
  symbol?: string,
  decimals: number = 18,
  displayDecimals: number = 6,
): string {
  const [wholePart, fractionPart = ""] = formatUnits(value, decimals).split(".");
  const truncatedFraction = fractionPart.slice(0, displayDecimals);
  const formattedWhole = addThousandsSeparators(wholePart);
  const trimmedFraction = truncatedFraction.replace(/0+$/, "");
  const formattedValue = trimmedFraction
    ? `${formattedWhole}.${trimmedFraction}`
    : formattedWhole;

  return symbol ? `${formattedValue} ${symbol}` : formattedValue;
}

export function formatTokenAmountInput(
  value: bigint,
  decimals: number = 18,
): string {
  return trimTrailingZeros(formatUnits(value, decimals));
}

export function parseTokenAmount(value: string, decimals: number = 18): bigint {
  const normalizedValue = value.trim().replace(/,/g, "");

  if (!/^\d*(\.\d*)?$/.test(normalizedValue) || normalizedValue === "") {
    return 0n;
  }

  const [wholePart = "0", fractionPart = ""] = normalizedValue.split(".");
  const safeWholePart = wholePart === "" ? "0" : wholePart;
  const safeFractionPart = fractionPart.slice(0, decimals);
  const safeValue =
    safeFractionPart.length > 0
      ? `${safeWholePart}.${safeFractionPart}`
      : safeWholePart;

  try {
    return parseUnits(safeValue, decimals);
  } catch {
    return 0n;
  }
}
