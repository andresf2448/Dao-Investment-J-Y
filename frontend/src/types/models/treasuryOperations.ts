import type { ProtocolCapabilities } from "@/types/capabilities";
import type { AssetCategory } from "@/types/treasury";

export interface TreasuryOperationToken {
  symbol: string;
  address: string;
  category: AssetCategory;
  decimals: number;
  isKnownAsset: boolean;
}

export interface TreasuryOperationsModel {
  tokens: TreasuryOperationToken[];
  tokenAddress: string;
  setTokenAddress: (value: string) => void;
  selectedToken: TreasuryOperationToken | null;
  setSelectedToken: (token: TreasuryOperationToken) => void;
  amount: string;
  setAmount: (value: string) => void;
  recipient: string;
  setRecipient: (value: string) => void;
  isAmountValid: boolean;
  isRecipientValid: boolean;
  canExecute: boolean;
  isSubmitting: boolean;
  capabilities: ProtocolCapabilities;
  executeWithdrawal: () => Promise<void>;
}
