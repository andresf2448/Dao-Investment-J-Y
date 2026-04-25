import { useMemo } from "react";
import { ERC20_DEFAULT, formatTokenAmount, getNetworkName } from "@/utils";
import {
  dashboardProtocolReadDefinitions,
  type DashboardProtocolReadContext,
} from "@/hooks/definitions/protocolReads";
import type {
  ActivityItem,
  DashboardMetrics,
  DashboardModel,
  ProtocolStatus,
} from "@/types/models/dashboard";
import { useProtocolCapabilities } from "./useProtocolCapabilities";
import { useProtocolReads } from "./useProtocolReads";
import { useChainId } from "wagmi";

export function useDashboardModel(): DashboardModel {
  const chainId = useChainId();
  const capabilities = useProtocolCapabilities();
  const dashboardReadContext = useMemo<DashboardProtocolReadContext>(
    () => ({
      treasuryToken: ERC20_DEFAULT,
    }),
    [],
  );
  const dashboardReads = useProtocolReads(
    dashboardProtocolReadDefinitions,
    dashboardReadContext,
  );

  const metrics: DashboardMetrics = {
    totalVaults:
      typeof dashboardReads.totalVaults === "bigint"
        ? Number(dashboardReads.totalVaults)
        : 0,
    treasuryValue:
      typeof dashboardReads.treasuryERC20Balance === "bigint"
        ? formatTokenAmount(dashboardReads.treasuryERC20Balance, "USDT")
        : "0.000000 USDT",
    proposalThreshold:
      typeof dashboardReads.proposalThreshold === "bigint"
        ? (Number(dashboardReads.proposalThreshold) / 10 ** 18).toString()
        : "0",
    guardianCount: dashboardReads.guardianCount
      ? Number(dashboardReads.guardianCount)
      : 0,
  };

  const status: ProtocolStatus = {
    network: getNetworkName(chainId),
    bonding: dashboardReads.isBondingFinalized ? "finalized" : "active",
    vaultCreation: dashboardReads.isVaultCreationPaused ? "paused" : "enabled",
    deposits: dashboardReads.isDepositsPaused ? "paused" : "enabled",
    execution: dashboardReads.isExecutionPaused ? "paused" : "monitoring",
  };

  // TODO:
  // ===== FUTURO =====
  // activity -> eventos (subgraph idealmente)
  const activity: ActivityItem[] = [
    {
      id: "1",
      title: "Guardian application submitted",
      description: "A new guardian entered governance review.",
    },
    {
      id: "2",
      title: "Vault deployed",
      description: "A new vault was registered in the protocol.",
    },
    {
      id: "3",
      title: "Treasury updated",
      description: "Balances refreshed across tracked assets.",
    },
  ];

  return {
    metrics,
    status,
    activity,
    capabilities,
  };
}
