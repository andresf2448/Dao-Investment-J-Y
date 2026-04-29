import type { ProtocolCapabilities } from "@/types/capabilities";

export type RiskExecutionStatus = "monitoring" | "paused";
export type RiskAssetHealth = "Healthy" | "Monitoring" | "Critical";
export type StableValue = "Yes" | "No";

export interface RiskAsset {
  asset: string;
  feed: string;
  heartbeat: string;
  stable: StableValue;
  range: string;
  health: RiskAssetHealth;
  price: string;
}

export interface RiskMetrics {
  executionStatus: RiskExecutionStatus;
  knownAssets: number;
  configuredAssets: number;
  healthyAssets: number;
  riskAlerts: number;
}

export interface RiskSummary {
  executionEngineValue: string;
  assetValidationValue: string;
  emergencyControlsValue: string;
  priceMonitoringValue: string;
}

export interface RiskForm {
  assetAddress: string;
  setAssetAddress: (value: string) => void;
  priceFeed: string;
  setPriceFeed: (value: string) => void;
  heartbeat: string;
  setHeartbeat: (value: string) => void;
  stableAsset: string;
  setStableAsset: (value: string) => void;
  depegMinBps: string;
  setDepegMinBps: (value: string) => void;
  depegMaxBps: string;
  setDepegMaxBps: (value: string) => void;
  assetAddressError?: string;
  priceFeedError?: string;
  heartbeatError?: string;
  stableAssetError?: string;
  depegMinBpsError?: string;
  depegMaxBpsError?: string;
  canUpdateAssetConfiguration: boolean;
  assetConfigurationLockedMessage?: string;
}

export interface RiskActions {
  pauseExecution: () => Promise<void>;
  resumeExecution: () => Promise<void>;
  updateAssetConfiguration: () => Promise<void>;
}

export interface RiskModel {
  metrics: RiskMetrics;
  assets: RiskAsset[];
  form: RiskForm;
  actions: RiskActions;
  summary: RiskSummary;
  capabilities: ProtocolCapabilities;
  isSubmitting: boolean;
}
