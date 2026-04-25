import {
  getDaoGovernorContract,
  getGenesisBondingContract,
  getGuardianAdministratorContract,
  getGuardianBondEscrowContract,
  getProtocolCoreContract,
  getRiskManagerContract,
  getTreasuryContract,
  getVaultRegistryContract,
} from "@dao/contracts-sdk";
import { useMemo } from "react";
import { useChainId, useReadContracts } from "wagmi";
import type { Address } from "viem";
import type {
  AdminContractItem,
  AdminDiagnostic,
  AdminMetrics,
  AdminModel,
  AdminSummary,
} from "@/types/models/admin";
import { getProtocolDeploymentAddresses } from "@/constants/deployments";
import { useProtocolCapabilities } from "./useProtocolCapabilities";
import { getVaultFactoryContract } from "./getVaultFactoryContract";
import { resolveOptionalContract } from "./shared/resolveContract";
import { getReadContractResult, ZERO_ADDRESS } from "./shared/contractResults";

export function useAdminModel(): AdminModel {
  const chainId = useChainId();
  const capabilities = useProtocolCapabilities();
  const deployment = useMemo(
    () => getProtocolDeploymentAddresses(chainId),
    [chainId],
  );

  const protocolCoreConfig = useMemo(
    () => resolveOptionalContract(chainId, getProtocolCoreContract),
    [chainId],
  );
  const treasuryConfig = useMemo(
    () => resolveOptionalContract(chainId, getTreasuryContract),
    [chainId],
  );
  const riskManagerConfig = useMemo(
    () => resolveOptionalContract(chainId, getRiskManagerContract),
    [chainId],
  );
  const genesisBondingConfig = useMemo(
    () => resolveOptionalContract(chainId, getGenesisBondingContract),
    [chainId],
  );
  const guardianAdministratorConfig = useMemo(
    () => resolveOptionalContract(chainId, getGuardianAdministratorContract),
    [chainId],
  );
  const guardianBondEscrowConfig = useMemo(
    () => resolveOptionalContract(chainId, getGuardianBondEscrowContract),
    [chainId],
  );
  const vaultFactoryConfig = useMemo(
    () => resolveOptionalContract(chainId, getVaultFactoryContract),
    [chainId],
  );
  const vaultRegistryConfig = useMemo(
    () => resolveOptionalContract(chainId, getVaultRegistryContract),
    [chainId],
  );
  const daoGovernorConfig = useMemo(
    () => resolveOptionalContract(chainId, getDaoGovernorContract),
    [chainId],
  );

  const contracts: AdminContractItem[] = useMemo(() => {
    if (!deployment) {
      return [];
    }

    return [
      {
        name: "ProtocolCore",
        address: deployment.protocolCore,
        group: "Core Contracts",
        upgradeable: Boolean(protocolCoreConfig),
      },
      {
        name: "Treasury",
        address: deployment.treasury,
        group: "Core Contracts",
      },
      {
        name: "RiskManager",
        address: deployment.riskManager,
        group: "Core Contracts",
        upgradeable: Boolean(riskManagerConfig),
      },
      {
        name: "StrategyRouter",
        address: deployment.strategyRouter,
        group: "Core Contracts",
        upgradeable: true,
      },
      {
        name: "GenesisBonding",
        address: deployment.genesisBonding,
        group: "Governance Contracts",
      },
      {
        name: "DaoGovernor",
        address: deployment.daoGovernor,
        group: "Governance Contracts",
        upgradeable: Boolean(daoGovernorConfig),
      },
      {
        name: "TimeLock",
        address: deployment.timeLock,
        group: "Governance Contracts",
      },
      {
        name: "GuardianAdministrator",
        address: deployment.guardianAdministrator,
        group: "Guardian Contracts",
      },
      {
        name: "GuardianBondEscrow",
        address: deployment.guardianBondEscrow,
        group: "Guardian Contracts",
      },
      {
        name: "VaultFactory",
        address: deployment.vaultFactory,
        group: "Vault Infrastructure",
      },
      {
        name: "VaultRegistry",
        address: deployment.vaultRegistry,
        group: "Vault Infrastructure",
      },
    ];
  }, [
    deployment,
    daoGovernorConfig,
    protocolCoreConfig,
    riskManagerConfig,
  ]);

  const { data } = useReadContracts({
    allowFailure: true,
    contracts: [
      ...(protocolCoreConfig
        ? [
            {
              abi: protocolCoreConfig.abi,
              address: protocolCoreConfig.address,
              functionName: "isVaultCreationPaused" as const,
            },
            {
              abi: protocolCoreConfig.abi,
              address: protocolCoreConfig.address,
              functionName: "isVaultDepositsPaused" as const,
            },
          ]
        : []),
      ...(riskManagerConfig
        ? [
            {
              abi: riskManagerConfig.abi,
              address: riskManagerConfig.address,
              functionName: "executionPaused" as const,
            },
          ]
        : []),
      ...(genesisBondingConfig
        ? [
            {
              abi: genesisBondingConfig.abi,
              address: genesisBondingConfig.address,
              functionName: "isFinalized" as const,
            },
          ]
        : []),
      ...(treasuryConfig
        ? [
            {
              abi: treasuryConfig.abi,
              address: treasuryConfig.address,
              functionName: "protocolCore" as const,
            },
          ]
        : []),
      ...(guardianAdministratorConfig
        ? [
            {
              abi: guardianAdministratorConfig.abi,
              address: guardianAdministratorConfig.address,
              functionName: "minStake" as const,
            },
            {
              abi: guardianAdministratorConfig.abi,
              address: guardianAdministratorConfig.address,
              functionName: "totalActiveGuardians" as const,
            },
            {
              abi: guardianAdministratorConfig.abi,
              address: guardianAdministratorConfig.address,
              functionName: "bondEscrow" as const,
            },
          ]
        : []),
      ...(guardianBondEscrowConfig
        ? [
            {
              abi: guardianBondEscrowConfig.abi,
              address: guardianBondEscrowConfig.address,
              functionName: "guardianAdministrator" as const,
            },
            {
              abi: guardianBondEscrowConfig.abi,
              address: guardianBondEscrowConfig.address,
              functionName: "getApplicationTokenBalance" as const,
            },
          ]
        : []),
      ...(vaultFactoryConfig
        ? [
            {
              abi: vaultFactoryConfig.abi,
              address: vaultFactoryConfig.address,
              functionName: "router" as const,
            },
            {
              abi: vaultFactoryConfig.abi,
              address: vaultFactoryConfig.address,
              functionName: "core" as const,
            },
            {
              abi: vaultFactoryConfig.abi,
              address: vaultFactoryConfig.address,
              functionName: "guardianAdministrator" as const,
            },
            {
              abi: vaultFactoryConfig.abi,
              address: vaultFactoryConfig.address,
              functionName: "vaultRegistry" as const,
            },
          ]
        : []),
      ...(vaultRegistryConfig
        ? [
            {
              abi: vaultRegistryConfig.abi,
              address: vaultRegistryConfig.address,
              functionName: "getAllVaults" as const,
            },
          ]
        : []),
      ...(daoGovernorConfig
        ? [
            {
              abi: daoGovernorConfig.abi,
              address: daoGovernorConfig.address,
              functionName: "proposalThreshold" as const,
            },
          ]
        : []),
    ] as readonly unknown[],
    query: {
      enabled: Boolean(
        protocolCoreConfig ||
          riskManagerConfig ||
          genesisBondingConfig ||
          treasuryConfig ||
          guardianAdministratorConfig ||
          guardianBondEscrowConfig ||
          vaultFactoryConfig ||
          vaultRegistryConfig ||
          daoGovernorConfig,
      ),
    },
  });

  let index = 0;
  const isVaultCreationPaused = protocolCoreConfig
    ? getReadContractResult<boolean>(data?.[index++]) ?? false
    : false;
  const isVaultDepositsPaused = protocolCoreConfig
    ? getReadContractResult<boolean>(data?.[index++]) ?? false
    : false;
  const executionPaused = riskManagerConfig
    ? getReadContractResult<boolean>(data?.[index++]) ?? false
    : false;
  const isBondingFinalized = genesisBondingConfig
    ? getReadContractResult<boolean>(data?.[index++]) ?? false
    : false;
  const treasuryProtocolCore = treasuryConfig
    ? getReadContractResult<`0x${string}`>(data?.[index++]) ?? ZERO_ADDRESS
    : ZERO_ADDRESS;
  const minStake = guardianAdministratorConfig
    ? getReadContractResult<bigint>(data?.[index++]) ?? 0n
    : 0n;
  const activeGuardians = guardianAdministratorConfig
    ? getReadContractResult<bigint>(data?.[index++]) ?? 0n
    : 0n;
  const guardianBondEscrowAddress = guardianAdministratorConfig
    ? getReadContractResult<`0x${string}`>(data?.[index++]) ?? ZERO_ADDRESS
    : ZERO_ADDRESS;
  const escrowGuardianAdministrator = guardianBondEscrowConfig
    ? getReadContractResult<`0x${string}`>(data?.[index++]) ?? ZERO_ADDRESS
    : ZERO_ADDRESS;
  const applicationTokenBalance = guardianBondEscrowConfig
    ? getReadContractResult<bigint>(data?.[index++]) ?? 0n
    : 0n;
  const factoryRouter = vaultFactoryConfig
    ? getReadContractResult<`0x${string}`>(data?.[index++]) ?? ZERO_ADDRESS
    : ZERO_ADDRESS;
  const factoryCore = vaultFactoryConfig
    ? getReadContractResult<`0x${string}`>(data?.[index++]) ?? ZERO_ADDRESS
    : ZERO_ADDRESS;
  const factoryGuardianAdministrator = vaultFactoryConfig
    ? getReadContractResult<`0x${string}`>(data?.[index++]) ?? ZERO_ADDRESS
    : ZERO_ADDRESS;
  const vaultRegistryAddress = vaultFactoryConfig
    ? getReadContractResult<`0x${string}`>(data?.[index++]) ?? ZERO_ADDRESS
    : ZERO_ADDRESS;
  const registryVaults = vaultRegistryConfig
    ? getReadContractResult<readonly Address[] | readonly string[]>(
        data?.[index++],
      ) ?? []
    : [];
  const proposalThreshold = daoGovernorConfig
    ? getReadContractResult<bigint>(data?.[index++]) ?? 0n
    : 0n;

  const upgradeableSystems = contracts.filter((contract) => contract.upgradeable)
    .length;

  const contractRegistryAvailable = contracts.length > 0;
  const allCoreWired =
    treasuryProtocolCore !== ZERO_ADDRESS &&
    factoryRouter !== ZERO_ADDRESS &&
    factoryCore !== ZERO_ADDRESS &&
    factoryGuardianAdministrator !== ZERO_ADDRESS &&
    vaultRegistryAddress !== ZERO_ADDRESS &&
    guardianBondEscrowAddress !== ZERO_ADDRESS &&
    escrowGuardianAdministrator !== ZERO_ADDRESS;

  const metrics: AdminMetrics = {
    contractsTracked: contracts.length,
    upgradeableSystems,
    diagnostics: contractRegistryAvailable ? "Live" : "Unavailable",
    adminPosture: capabilities.canAccessAdminConsole
      ? "Controlled"
      : "Restricted",
  };

  const diagnostics: AdminDiagnostic[] = [
    {
      title: "Vault Creation State",
      value: isVaultCreationPaused ? "Paused" : "Enabled",
      subtitle: "Derived from ProtocolCore pause state",
      tone: isVaultCreationPaused ? "warning" : "success",
    },
    {
      title: "Vault Deposit State",
      value: isVaultDepositsPaused ? "Paused" : "Enabled",
      subtitle: "Derived from ProtocolCore pause state",
      tone: isVaultDepositsPaused ? "warning" : "success",
    },
    {
      title: "Execution Engine",
      value: executionPaused ? "Paused" : "Monitoring",
      subtitle: "Derived from RiskManager execution state",
      tone: executionPaused ? "warning" : "success",
    },
    {
      title: "Bonding Program",
      value: isBondingFinalized ? "Finalized" : "Active",
      subtitle: "Derived from GenesisBonding finalization state",
      tone: isBondingFinalized ? "neutral" : "success",
    },
    {
      title: "Treasury Core Wiring",
      value: treasuryProtocolCore !== ZERO_ADDRESS ? "Configured" : "Unavailable",
      subtitle: "Treasury protocol core reference available",
      tone: treasuryProtocolCore !== ZERO_ADDRESS ? "neutral" : "warning",
    },
    {
      title: "Guardian Escrow Wiring",
      value: guardianBondEscrowAddress !== ZERO_ADDRESS ? "Configured" : "Unavailable",
      subtitle: "Guardian bond escrow reference available",
      tone: guardianBondEscrowAddress !== ZERO_ADDRESS ? "neutral" : "warning",
    },
  ];

  const summary: AdminSummary = {
    contractRegistryValue: contractRegistryAvailable
      ? `${contracts.length} contracts`
      : "Unavailable",
    capabilitiesValue: capabilities.canAccessAdminConsole
      ? "Enabled"
      : "Restricted",
    upgradeableAwarenessValue: `${upgradeableSystems} systems`,
    protocolDiagnosticsValue: contractRegistryAvailable
      ? `${allCoreWired ? "Live" : "Degraded"}`
      : "Unavailable",
  };

  void activeGuardians;
  void minStake;
  void applicationTokenBalance;
  void factoryRouter;
  void factoryCore;
  void registryVaults;
  void proposalThreshold;

  return {
    metrics,
    contracts,
    diagnostics,
    summary,
    capabilities,
  };
}
