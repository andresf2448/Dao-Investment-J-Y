import { getDaoGovernorContract, getGovernanceTokenContract } from "@dao/contracts-sdk";
import { useMemo } from "react";
import { useBlockNumber, useChainId, useConnection, useReadContracts } from "wagmi";
import { useProtocolCapabilities } from "./useProtocolCapabilities";
import type {
  GovernanceConfig,
  GovernanceMetrics,
  GovernanceModel,
  GovernanceProposalSummary,
  GovernanceUserState,
} from "@/types/governance";
import { useProtocolReads } from "./useProtocolReads";
import { governanceProtocolReadDefinitions } from "./definitions/protocolReads";
import { formatEstimatedBlockDate, formatTokenAmount } from "@/utils";
import { getReadContractResult } from "./shared/contractResults";
import type { GovernorProposalVotes } from "./shared/contractTypes";
import {
  getRecentProposalIndexes,
  mapGovernorProposalState,
} from "./shared/governance";
import { resolveOptionalContract } from "./shared/resolveContract";

export function useGovernanceModel(): GovernanceModel {
  const chainId = useChainId();
  const connection = useConnection();
  const capabilities = useProtocolCapabilities();
  const { data: currentBlock } = useBlockNumber({
    watch: true,
  });
  const { votingDelay, votingPeriod, proposalThreshold } = useProtocolReads(
    governanceProtocolReadDefinitions,
  );

  const daoGovernorConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getDaoGovernorContract);
  }, [chainId]);

  const governanceTokenConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getGovernanceTokenContract);
  }, [chainId]);

  const { data: proposalCountData } = useReadContracts({
    allowFailure: true,
    contracts: daoGovernorConfig
      ? [
          {
            abi: daoGovernorConfig.abi,
            address: daoGovernorConfig.address,
            functionName: "proposalCount" as const,
          },
        ]
      : [],
    query: {
      enabled: Boolean(daoGovernorConfig),
    },
  });

  const proposalCount = getReadContractResult<bigint>(proposalCountData?.[0]) ?? 0n;
  const proposalIndexes = getRecentProposalIndexes(proposalCount);

  const { data: proposalDetailsData } = useReadContracts({
    allowFailure: true,
    contracts: daoGovernorConfig
      ? proposalIndexes.map((index) => ({
          abi: daoGovernorConfig.abi,
          address: daoGovernorConfig.address,
          functionName: "proposalDetailsAt" as const,
          args: [BigInt(index)],
        }))
      : [],
    query: {
      enabled: Boolean(daoGovernorConfig) && proposalIndexes.length > 0,
    },
  });

  const proposalDetails = useMemo(
    () =>
      (proposalDetailsData ?? []).reduce<
        Array<{
          proposalId: bigint;
          actionCount: number;
        }>
      >((accumulator, item) => {
        const detail = getReadContractResult<
          readonly [bigint, readonly string[], readonly bigint[], readonly string[], string]
        >(item);

        if (detail?.[0] != null) {
          accumulator.push({
            proposalId: detail[0],
            actionCount: detail[1]?.length ?? 0,
          });
        }

        return accumulator;
      }, []),
    [proposalDetailsData],
  );

  const proposalIds = useMemo(
    () => proposalDetails.map((proposal) => proposal.proposalId),
    [proposalDetails],
  );

  const { data: proposalStateData } = useReadContracts({
    allowFailure: true,
    contracts: daoGovernorConfig
      ? proposalIds.flatMap((proposalId) => [
          {
            abi: daoGovernorConfig.abi,
            address: daoGovernorConfig.address,
            functionName: "state" as const,
            args: [proposalId],
          },
          {
            abi: daoGovernorConfig.abi,
            address: daoGovernorConfig.address,
            functionName: "proposalVotes" as const,
            args: [proposalId],
          },
          {
            abi: daoGovernorConfig.abi,
            address: daoGovernorConfig.address,
            functionName: "proposalDeadline" as const,
            args: [proposalId],
          },
        ])
      : [],
    query: {
      enabled: Boolean(daoGovernorConfig) && proposalIds.length > 0,
    },
  });

  const { data: userVotingPowerData } = useReadContracts({
    allowFailure: true,
    contracts:
      governanceTokenConfig && connection.address
        ? [
            {
              abi: governanceTokenConfig.abi,
              address: governanceTokenConfig.address,
              functionName: "getVotes" as const,
              args: [connection.address],
            },
          ]
        : [],
    query: {
      enabled: Boolean(governanceTokenConfig && connection.address),
    },
  });

  const { data: userGovernanceTokenBalanceData } = useReadContracts({
    allowFailure: true,
    contracts:
      governanceTokenConfig && connection.address
        ? [
            {
              abi: governanceTokenConfig.abi,
              address: governanceTokenConfig.address,
              functionName: "balanceOf" as const,
              args: [connection.address],
            },
          ]
        : [],
    query: {
      enabled: Boolean(governanceTokenConfig && connection.address),
    },
  });

  const proposals = useMemo<GovernanceProposalSummary[]>(() => {
    return proposalDetails.map(({ proposalId, actionCount }, index) => {
      const stateIndex = index * 3;
      const rawState = getReadContractResult<number | bigint>(
        proposalStateData?.[stateIndex],
      );
      const proposalVotes =
        getReadContractResult<GovernorProposalVotes>(
          proposalStateData?.[stateIndex + 1],
        ) ??
        [0n, 0n, 0n];
      const proposalDeadline = getReadContractResult<bigint>(
        proposalStateData?.[stateIndex + 2],
      );
      const totalVotes =
        (proposalVotes[0] ?? 0n) +
        (proposalVotes[1] ?? 0n) +
        (proposalVotes[2] ?? 0n);

      return {
        id: proposalId.toString(),
        title:
          actionCount > 0
            ? `Governance proposal with ${actionCount} action${actionCount === 1 ? "" : "s"}`
            : "Governance proposal",
        status: mapGovernorProposalState(rawState),
        votes: formatTokenAmount(totalVotes, "GOV"),
        endDate: formatEstimatedBlockDate({
          targetBlock: proposalDeadline,
          currentBlock,
          chainId,
        }),
      };
    });
  }, [chainId, currentBlock, proposalDetails, proposalStateData]);

  const config: GovernanceConfig = {
    proposalThreshold:
      typeof proposalThreshold === "bigint"
        ? formatTokenAmount(proposalThreshold, "GOV")
        : "0 GOV",
    votingDelay: votingDelay ? `${votingDelay || "0"} blocks` : "0 blocks",
    votingPeriod: votingPeriod
      ? `${votingPeriod.toString()} blocks`
      : "0 blocks",
  };

  const metrics: GovernanceMetrics = {
    activeProposals: proposals.filter((proposal) => proposal.status === "Active").length,
    queuedProposals: proposals.filter((proposal) => proposal.status === "Queued").length,
    executedProposals: proposals.filter((proposal) => proposal.status === "Executed").length,
    participation: "On-chain list",
  };

  const votingPower = getReadContractResult<bigint>(userVotingPowerData?.[0]) ?? 0n;
  const governanceTokenBalance =
    getReadContractResult<bigint>(userGovernanceTokenBalanceData?.[0]) ?? 0n;
  const thresholdValue = typeof proposalThreshold === "bigint" ? proposalThreshold : 0n;

  const user: GovernanceUserState = {
    votingPower: formatTokenAmount(votingPower, "GOV"),
    governanceTokenBalance: formatTokenAmount(governanceTokenBalance, "GOV"),
    meetsProposalThreshold: votingPower >= thresholdValue && thresholdValue > 0n,
    hasGovernanceTokens: governanceTokenBalance > 0n,
  };

  return {
    config,
    metrics,
    proposals,
    user,
    capabilities,
  };
}
