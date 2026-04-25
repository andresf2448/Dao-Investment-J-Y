import type { ProtocolCapabilities } from "@/types/capabilities";

export type AdminContractGroup =
  | "Core Contracts"
  | "Governance Contracts"
  | "Guardian Contracts"
  | "Vault Infrastructure";

export type AdminDiagnosticsStatus =
  | "Live"
  | "Unavailable";

export type AdminPosture =
  | "Controlled"
  | "Restricted"
  | "Unavailable";

export interface AdminContractItem {
  name: string;
  address: string;
  group: AdminContractGroup;
  upgradeable?: boolean;
}

export interface AdminMetrics {
  contractsTracked: number;
  upgradeableSystems: number;
  diagnostics: AdminDiagnosticsStatus;
  adminPosture: AdminPosture;
}

export interface AdminSummary {
  contractRegistryValue: string;
  capabilitiesValue: string;
  upgradeableAwarenessValue: string;
  protocolDiagnosticsValue: string;
}

export type AdminDiagnosticTone = "success" | "warning" | "neutral";

export interface AdminDiagnostic {
  title: string;
  value: string;
  subtitle: string;
  tone: AdminDiagnosticTone;
}

export interface AdminModel {
  metrics: AdminMetrics;
  contracts: AdminContractItem[];
  diagnostics: AdminDiagnostic[];
  summary: AdminSummary;
  capabilities: ProtocolCapabilities;
}
