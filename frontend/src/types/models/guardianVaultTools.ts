import type { ProtocolCapabilities } from "@/types/capabilities";

export interface GuardianVaultAsset {
  symbol: string;
  address: string;
}

export interface GuardianVaultToolsModel {
  assets: GuardianVaultAsset[];
  selectedAsset: GuardianVaultAsset | null;
  setSelectedAsset: (asset: GuardianVaultAsset) => void;
  vaultName: string;
  setVaultName: (value: string) => void;
  vaultSymbol: string;
  setVaultSymbol: (value: string) => void;
  predictedAddress: string;
  pairExists: boolean;
  isVaultNameValid: boolean;
  isVaultSymbolValid: boolean;
  canCreateVault: boolean;
  isSubmitting: boolean;
  capabilities: ProtocolCapabilities;
  createVault: () => Promise<void>;
}
