import type { ProtocolCapabilities } from "@/types/capabilities";

export interface VaultPositionItem {
  vaultAddress: string;
  asset: string;
  deposited: string;
  shares: string;
  value: string;
}

export interface MyVaultPositionsModel {
  positions: VaultPositionItem[];
  totalDepositedValue: string;
  totalShareExposure: string;
  capabilities: ProtocolCapabilities;
}
