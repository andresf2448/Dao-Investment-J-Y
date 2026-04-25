export type AssetCategory = "DAO Asset" | "Non-DAO Asset" | "Native Asset";
export type AssetVisibility = "Tracked" | "Unavailable";
export type AssetType = "ERC20" | "Native";

export interface TreasuryAsset {
  token: string;
  type: AssetType;
  balance: string;
  category: AssetCategory;
  visibility: AssetVisibility;
}

export interface TreasuryMetrics {
  trackedErc20Assets: number;
  daoAssetExposure: string;
  operationalLiquidity: string;
  nativeReserve: string;
}

export interface TreasuryModel {
  assets: TreasuryAsset[];
  metrics: TreasuryMetrics;
  capabilities: import("./capabilities").ProtocolCapabilities;
}
