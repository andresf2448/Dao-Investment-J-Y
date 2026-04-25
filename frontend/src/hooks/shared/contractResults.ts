import type { Address } from "viem";

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as Address;

export function getReadContractResult<T>(value: unknown): T | undefined {
  if (typeof value === "object" && value !== null && "result" in value) {
    return (value as { result?: T }).result;
  }

  return value as T | undefined;
}

export function getReadResultValue<T>(value: unknown): T | undefined {
  return getReadContractResult<T>(value);
}
