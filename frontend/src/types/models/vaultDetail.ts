import type { ProtocolCapabilities } from "@/types/capabilities";

export type VaultDetailStatus = "Active" | "Inactive";

export interface VaultDetailData {
  address: string;
  asset: string;
  guardian: string;
  status: VaultDetailStatus;
  registeredAt: string;
  decimals: number;
  totalAssets: string;
  investedAssets: string;
  availableAssets: string;
}

export interface VaultDetailPosition {
  depositedAssets: string;
  mintedShares: string;
  withdrawableAssets: string;
  redeemableShares: string;
  shareValue: string;
}

export interface VaultDetailControls {
  depositsEnabled: boolean;
  strategyExecutionEnabled: boolean;
}

export interface VaultStrategyAllocationInput {
  adapter: string;
  percentage: string;
}

export type VaultStrategyAction = 0 | 1;

export interface VaultStrategyAllocationStatus {
  adapter: string;
  percentage: string;
  isAdapterValid: boolean;
  isAdapterAllowed: boolean;
  isQueryLoaded: boolean;
  isComplete: boolean;
  isValidationPending: boolean;
  error?: string;
}

export interface VaultDetailModel {
  vault: VaultDetailData;
  position: VaultDetailPosition;
  controls: VaultDetailControls;
  strategyRouterAdapters: string[];
  strategyAllocationStatuses: VaultStrategyAllocationStatus[];
  strategyExecutionMessage?: string;
  strategyExecutionReady: boolean;
  capabilities: ProtocolCapabilities;
  isSubmitting: boolean;
  depositAssetBalance: string;
  hasDepositAssetBalance: boolean;
  hasWithdrawableAssets: boolean;
  hasRedeemableShares: boolean;
  isVaultGuardian: boolean;
  canShowGuardianOperations: boolean;
  maxWithdrawInputValue: string;
  maxRedeemInputValue: string;
  isWithdrawAmountWithinLimit: (amount: string) => boolean;
  isRedeemAmountWithinLimit: (amount: string) => boolean;
  deposit: (amount: string) => Promise<boolean>;
  mint: (amount: string) => Promise<boolean>;
  withdraw: (amount: string) => Promise<boolean>;
  redeem: (amount: string) => Promise<boolean>;
  executeStrategy: (action: VaultStrategyAction) => Promise<boolean>;
}
