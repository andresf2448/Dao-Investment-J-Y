import { getDaoGovernorContract, getRiskManagerContract } from "@dao/contracts-sdk";
import { useCallback, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useChainId, useReadContracts } from "wagmi";
import { encodeFunctionData, parseEventLogs, type Address } from "viem";
import type {
  RiskActions,
  RiskAsset,
  RiskForm,
  RiskMetrics,
  RiskModel,
  RiskSummary,
} from "@/types/models/risk";
import { getKnownProtocolAssets } from "@/constants/protocolAssets";
import {
  formatAddress,
  formatTokenAmount,
  getTransactionError,
  isValidAddress,
  saveProposalMetadata,
} from "@/utils";
import { useProtocolCapabilities } from "./useProtocolCapabilities";
import {
  getReadContractResult,
  ZERO_ADDRESS,
} from "./shared/contractResults";
import type { RiskManagerAssetConfig } from "./shared/contractTypes";
import { resolveOptionalContract } from "./shared/resolveContract";
import useWriteContracts from "./useWriteContracts";

export function useRiskModel(): RiskModel {
  const chainId = useChainId();
  const capabilities = useProtocolCapabilities();
  const { executeWrite } = useWriteContracts();
  const knownAssets = useMemo(() => getKnownProtocolAssets(chainId), [chainId]);
  const riskManagerConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getRiskManagerContract);
  }, [chainId]);
  const governorConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getDaoGovernorContract);
  }, [chainId]);

  const [assetAddress, setAssetAddress] = useState("");
  const [priceFeed, setPriceFeed] = useState("");
  const [heartbeat, setHeartbeat] = useState("");
  const [stableAsset, setStableAsset] = useState("");
  const [depegMinBps, setDepegMinBps] = useState("");
  const [depegMaxBps, setDepegMaxBps] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, refetch } = useReadContracts({
    allowFailure: true,
    contracts: (riskManagerConfig
      ? [
          {
            abi: riskManagerConfig.abi,
            address: riskManagerConfig.address,
            functionName: "executionPaused" as const,
          },
          ...knownAssets.flatMap((asset) => [
            {
              abi: riskManagerConfig.abi,
              address: riskManagerConfig.address,
              functionName: "getAssetConfig" as const,
              args: [asset.address],
            },
            {
              abi: riskManagerConfig.abi,
              address: riskManagerConfig.address,
              functionName: "isAssetHealthy" as const,
              args: [asset.address],
            },
            {
              abi: riskManagerConfig.abi,
              address: riskManagerConfig.address,
              functionName: "getValidatedPrice" as const,
              args: [asset.address],
            },
          ]),
        ]
      : []) as readonly unknown[],
    query: {
      enabled: Boolean(riskManagerConfig),
    },
  });

  const executionPaused = getReadContractResult<boolean>(data?.[0]) ?? false;

  const assets = useMemo<RiskAsset[]>(() => {
    return knownAssets.reduce<RiskAsset[]>((accumulator, asset, index) => {
      const dataOffset = 1 + index * 3;
      const config = getReadContractResult<RiskManagerAssetConfig>(
        data?.[dataOffset],
      );

      if (!config || config.feed === ZERO_ADDRESS) {
        return accumulator;
      }

      const isHealthy =
        getReadContractResult<boolean>(data?.[dataOffset + 1]) ?? false;
      const validatedPrice = getReadContractResult<bigint>(data?.[dataOffset + 2]);
      const range = config.isStable
        ? `${(config.depegMinBps / 10_000).toFixed(2)} - ${(config.depegMaxBps / 10_000).toFixed(2)}`
        : "N/A";

      accumulator.push({
        asset: asset.symbol,
        feed: formatAddress(config.feed),
        heartbeat: `${Number(config.heartbeat)}s`,
        stable: config.isStable ? "Yes" : "No",
        range,
        health: executionPaused
          ? "Critical"
          : isHealthy
            ? "Healthy"
            : "Monitoring",
        price:
          typeof validatedPrice === "bigint"
            ? formatTokenAmount(validatedPrice, "USD")
            : "Unavailable",
      });

      return accumulator;
    }, []);
  }, [data, executionPaused, knownAssets]);

  const metrics: RiskMetrics = {
    executionStatus: executionPaused ? "paused" : "monitoring",
    knownAssets: knownAssets.length,
    configuredAssets: assets.length,
    healthyAssets: assets.filter((asset) => asset.health === "Healthy").length,
    riskAlerts:
      assets.filter((asset) => asset.health !== "Healthy").length +
      (executionPaused ? 1 : 0),
  };

  const summary: RiskSummary = {
    executionEngineValue: executionPaused ? "Paused" : "Monitoring",
    assetValidationValue: assets.length > 0 ? "Enabled" : "Unavailable",
    emergencyControlsValue:
      capabilities.canPauseRiskExecution || capabilities.canResumeRiskExecution
        ? "Available"
        : "Restricted",
    priceMonitoringValue:
      assets.some((asset) => asset.price !== "Unavailable")
        ? "Live"
        : "Unavailable",
  };

  const assetAddressError =
    assetAddress.trim() !== "" && !isValidAddress(assetAddress.trim())
      ? "Enter a valid asset address."
      : undefined;
  const priceFeedError =
    priceFeed.trim() !== "" && !isValidAddress(priceFeed.trim())
      ? "Enter a valid price feed address."
      : undefined;
  const heartbeatError =
    heartbeat.trim() !== "" &&
    (!Number.isInteger(Number(heartbeat)) || Number(heartbeat) <= 0)
      ? "Heartbeat must be a positive integer."
      : undefined;
  const stableAssetError =
    stableAsset.trim() !== "" &&
    stableAsset.trim() !== "true" &&
    stableAsset.trim() !== "false"
      ? 'Stable asset must be "true" or "false".'
      : undefined;
  const depegMinBpsError =
    depegMinBps.trim() !== "" &&
    (!Number.isInteger(Number(depegMinBps)) || Number(depegMinBps) < 0)
      ? "Depeg min BPS must be an integer greater than or equal to 0."
      : undefined;
  const depegMaxBpsError =
    depegMaxBps.trim() !== "" &&
    (!Number.isInteger(Number(depegMaxBps)) ||
      Number(depegMaxBps) < Number(depegMinBps || 0))
      ? "Depeg max BPS must be an integer greater than or equal to depeg min BPS."
      : undefined;

  const canUpdateAssetConfiguration =
    capabilities.canCreateProposal &&
    isValidAddress(assetAddress.trim()) &&
    isValidAddress(priceFeed.trim()) &&
    heartbeat.trim() !== "" &&
    Number.isInteger(Number(heartbeat)) &&
    Number(heartbeat) > 0 &&
    (stableAsset.trim() === "true" || stableAsset.trim() === "false") &&
    depegMinBps.trim() !== "" &&
    Number.isInteger(Number(depegMinBps)) &&
    Number(depegMinBps) >= 0 &&
    depegMaxBps.trim() !== "" &&
    Number.isInteger(Number(depegMaxBps)) &&
    Number(depegMaxBps) >= Number(depegMinBps || 0);

  const assetConfigurationLockedMessage = !capabilities.canCreateProposal
    ? "Asset configuration updates are submitted as governance proposals and require enough voting power."
    : undefined;

  const executeOperation = useCallback(
    async (
      title: string,
      params: Parameters<typeof executeWrite>[0],
      onSuccess?: () => void | Promise<void>,
    ) => {
      Swal.fire({
        title,
        text: "Confirm the transaction in your wallet.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const response = await executeWrite({
          ...params,
          options: {
            waitForReceipt: true,
          },
        });

        if (response?.receipt?.status !== "success") {
          throw new Error("Transaction failed.");
        }

        await refetch();
        await onSuccess?.();
        Swal.close();

        await Swal.fire({
          title: "Risk configuration updated",
          text: "The blockchain state was updated successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (error) {
        const transactionError = getTransactionError(error);

        Swal.hideLoading();
        Swal.update({
          title: transactionError.title,
          text: transactionError.message,
          icon: "error",
          showConfirmButton: true,
          confirmButtonText: "OK",
          allowOutsideClick: true,
          allowEscapeKey: true,
        });
      }
    },
    [executeWrite, refetch],
  );

  const pauseExecution = useCallback(
    () =>
      executeOperation("Pausing strategy execution", {
        functionContract: "getRiskManagerContract",
        functionName: "pauseAdapterExecution",
      }),
    [executeOperation],
  );

  const resumeExecution = useCallback(
    () =>
      executeOperation("Resuming strategy execution", {
        functionContract: "getRiskManagerContract",
        functionName: "unpauseAdapterExecution",
      }),
    [executeOperation],
  );

  const updateAssetConfiguration = useCallback(
    async () => {
      if (!canUpdateAssetConfiguration || isSubmitting) {
        return;
      }

      if (!riskManagerConfig || !governorConfig) {
        throw new Error("Governance contracts unavailable.");
      }

      const confirmation = await Swal.fire({
        title: "Submit proposal",
        text: "Confirm the proposal submission transaction in your wallet.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, submit",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });

      if (!confirmation.isConfirmed) {
        return;
      }

      setIsSubmitting(true);

      Swal.fire({
        title: "Submitting proposal",
        text: "Confirm the proposal submission transaction in your wallet.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const calldata = encodeFunctionData({
        abi: riskManagerConfig.abi,
        functionName: "setAssetConfig",
        args: [
          assetAddress.trim() as Address,
          priceFeed.trim() as Address,
          Number(heartbeat),
          stableAsset.trim() === "true",
          Number(depegMinBps),
          Number(depegMaxBps),
          true,
        ],
      }) as `0x${string}`;

      const proposalTitle = "Update asset configuration";
      const proposalDescription =
        "This proposal requests DAO approval to update the RiskManager asset configuration.";
      const composedDescription = [proposalTitle, proposalDescription].join(
        "\n\n",
      );

      try {
        const response = await executeWrite({
          functionContract: "getDaoGovernorContract",
          functionName: "propose",
          args: [
            [riskManagerConfig.address],
            [0n],
            [calldata],
            composedDescription,
          ],
          options: {
            waitForReceipt: true,
          },
        });

        if (response?.receipt?.status !== "success") {
          throw new Error("Proposal submission failed.");
        }

        const proposalCreatedEvent = parseEventLogs({
          abi: governorConfig.abi,
          logs: response.receipt?.logs ?? [],
          eventName: "ProposalCreated",
        })?.[0];
        const proposalId = proposalCreatedEvent?.args?.proposalId?.toString();

        if (proposalId) {
          saveProposalMetadata(chainId, {
            proposalId,
            title: proposalTitle,
            description: proposalDescription,
            composedDescription,
          });
        }

        setAssetAddress("");
        setPriceFeed("");
        setHeartbeat("");
        setStableAsset("");
        setDepegMinBps("");
        setDepegMaxBps("");

        await refetch();
        Swal.close();

        await Swal.fire({
          title: "Proposal submitted",
          text: "Your governance proposal was sent successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (error) {
        const transactionError = getTransactionError(error);

        Swal.hideLoading();
        Swal.update({
          title: transactionError.title,
          text: transactionError.message,
          icon: "error",
          showConfirmButton: true,
          confirmButtonText: "OK",
          allowOutsideClick: true,
          allowEscapeKey: true,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      assetAddress,
      depegMaxBps,
      depegMinBps,
      canUpdateAssetConfiguration,
      chainId,
      executeWrite,
      governorConfig,
      isSubmitting,
      heartbeat,
      priceFeed,
      refetch,
      riskManagerConfig,
      stableAsset,
    ],
  );

  const form: RiskForm = {
    assetAddress,
    setAssetAddress,
    priceFeed,
    setPriceFeed,
    heartbeat,
    setHeartbeat,
    stableAsset,
    setStableAsset,
    depegMinBps,
    setDepegMinBps,
    depegMaxBps,
    setDepegMaxBps,
    assetAddressError,
    priceFeedError,
    heartbeatError,
    stableAssetError,
    depegMinBpsError,
    depegMaxBpsError,
    canUpdateAssetConfiguration,
    assetConfigurationLockedMessage,
  };

  const actions: RiskActions = {
    pauseExecution,
    resumeExecution,
    updateAssetConfiguration,
  };

  return {
    metrics,
    assets,
    form,
    actions,
    summary,
    capabilities,
    isSubmitting,
  };
}
