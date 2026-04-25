import type { Address } from "viem";

export type VaultRegistryDetail = {
  guardian: Address;
  asset: Address;
  registeredAt: bigint;
  active: boolean;
};

export type RiskManagerAssetConfig = {
  feed: Address;
  heartbeat: bigint;
  isStable: boolean;
  depegMinBps: number;
  depegMaxBps: number;
  enabled: boolean;
};

export type GovernorProposalVotes = readonly [bigint, bigint, bigint];
