import type { ProtocolCapabilities } from "@/types/capabilities";

export type OperationsToggleStatus = "enabled" | "paused";
export type InfrastructureState = "linked" | "partial" | "unconfigured";
export type WiringStatusTone = "success" | "warning" | "neutral" | "danger";

export interface OperationsStatus {
  vaultCreation: OperationsToggleStatus;
  vaultDeposits: OperationsToggleStatus;
  supportedAssetsCount: number;
  infrastructureState: InfrastructureState;
}

export interface InfrastructureWiring {
  factoryRouter: string;
  factoryCore: string;
  guardianAdministrator: string;
  vaultRegistry: string;
  adapterStrategy: string;
  treasuryProtocolCore: string;
}

export interface OperationsAssetSupportForm {
  supportedVaultAsset: string;
  setSupportedVaultAsset: (value: string) => void;
  supportedVaultAssetError?: string;
  canAddSupportedVaultAsset: boolean;
  supportedGenesisToken: string;
  setSupportedGenesisToken: (value: string) => void;
  supportedGenesisTokenError?: string;
  canUpdateSupportedGenesisTokens: boolean;
  supportedGenesisTokenCount: number;
  assetSupportPermissionMessage?: string;
}

export interface OperationsWiringForm {
  factoryRouterInput: string;
  setFactoryRouterInput: (value: string) => void;
  factoryRouterError?: string;
  canSubmitFactoryRouter: boolean;
  factoryCoreInput: string;
  setFactoryCoreInput: (value: string) => void;
  factoryCoreError?: string;
  canSubmitFactoryCore: boolean;
  guardianAdministratorInput: string;
  setGuardianAdministratorInput: (value: string) => void;
  guardianAdministratorError?: string;
  canSubmitGuardianAdministrator: boolean;
  vaultRegistryInput: string;
  setVaultRegistryInput: (value: string) => void;
  vaultRegistryError?: string;
  canSubmitVaultRegistry: boolean;
  treasuryProtocolCoreInput: string;
  setTreasuryProtocolCoreInput: (value: string) => void;
  treasuryProtocolCoreError?: string;
  canSubmitTreasuryProtocolCore: boolean;
  adapterStrategyInput: string;
  setAdapterStrategyInput: (value: string) => void;
  adapterStrategyError?: string;
  adapterStrategyStatusMessage?: string;
  adapterStrategyStatusTone?: WiringStatusTone;
  canSubmitAdapterStrategy: boolean;
  adapterStrategyAllowed: boolean;
  wiringPermissionMessage?: string;
}

export interface OperationsActions {
  pauseVaultCreation: () => Promise<void>;
  resumeVaultCreation: () => Promise<void>;
  pauseVaultDeposits: () => Promise<void>;
  resumeVaultDeposits: () => Promise<void>;
  addSupportedVaultAsset: () => Promise<void>;
  updateSupportedGenesisTokens: () => Promise<void>;
  setFactoryRouter: () => Promise<void>;
  setFactoryCore: () => Promise<void>;
  setGuardianAdministrator: () => Promise<void>;
  setVaultRegistry: () => Promise<void>;
  setAdapterStrategy: () => Promise<void>;
  setTreasuryProtocolCore: () => Promise<void>;
}

export interface OperationsModel {
  status: OperationsStatus;
  wiring: InfrastructureWiring;
  assetSupport: OperationsAssetSupportForm;
  wiringForm: OperationsWiringForm;
  actions: OperationsActions;
  summary: {
    protocolControlsValue: string;
    infrastructureAccessValue: string;
    infrastructureAccessSubtitle: string;
  };
  refetch: () => Promise<unknown>;
  capabilities: ProtocolCapabilities;
}
