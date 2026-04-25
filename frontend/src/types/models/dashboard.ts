import type { ProtocolCapabilities } from "@/types/capabilities";

export type DashboardBondingStatus = "active" | "finalized";
export type DashboardToggleStatus = "enabled" | "paused";
export type DashboardExecutionStatus = "monitoring" | "paused";

export interface DashboardMetrics {
  totalVaults: number;
  treasuryValue: string;
  proposalThreshold: string;
  guardianCount: number;
}

export interface ProtocolStatus {
  network: string;
  bonding: DashboardBondingStatus;
  vaultCreation: DashboardToggleStatus;
  deposits: DashboardToggleStatus;
  execution: DashboardExecutionStatus;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
}

export interface DashboardModel {
  metrics: DashboardMetrics;
  status: ProtocolStatus;
  activity: ActivityItem[];
  capabilities: ProtocolCapabilities;
}
