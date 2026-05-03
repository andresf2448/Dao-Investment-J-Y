import type { VaultStrategyAction } from "@/types/models/vaultDetail";

export const strategyActionCopy: Record<
  VaultStrategyAction,
  {
    title: string;
    confirmation: string;
  }
> = {
  0: {
    title: "Execute investment strategy",
    confirmation:
      "Confirm the investment strategy transaction in your wallet. The vault allocation will be routed across the selected adapters.",
  },
  1: {
    title: "Execute Divestment strategy",
    confirmation:
      "Confirm the Divestment strategy transaction in your wallet. The vault allocation will be routed across the selected adapters.",
  },
};
