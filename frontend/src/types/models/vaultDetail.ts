import type { ProtocolCapabilities } from "@/types/capabilities";

export type VaultDetailStatus = "Active" | "Inactive";

export interface VaultDetailData {
  address: string;
  asset: string;
  guardian: string;
  status: VaultDetailStatus;
  registeredAt: string;
  decimals: number;
}

export interface VaultDetailPosition {
  depositedAssets: string;
  mintedShares: string;
  withdrawableAssets: string;
  redeemableShares: string;
}

export interface VaultDetailControls {
  depositsEnabled: boolean;
  strategyExecutionEnabled: boolean;
}

export interface VaultDetailModel {
  vault: VaultDetailData;
  position: VaultDetailPosition;
  controls: VaultDetailControls;
  capabilities: ProtocolCapabilities;
}
