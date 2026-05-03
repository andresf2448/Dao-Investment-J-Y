import { parseAbi } from "viem";

export const abiStrategyAdapter = parseAbi([
  "function totalAssets(address vault, address asset) view returns (uint256)",
]);
