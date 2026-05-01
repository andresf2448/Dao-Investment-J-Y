import { useEffect, useMemo, useState } from "react";
import { useChainId, useConnection, useReadContracts } from "wagmi";
import type { Address } from "viem";
import type {
  VaultDetailControls,
  VaultDetailData,
  VaultDetailModel,
  VaultDetailPosition,
  VaultStrategyAction,
  VaultStrategyAllocationInput,
} from "@/types/models/vaultDetail";
import { useProtocolCapabilities } from "./useProtocolCapabilities";
import Swal from "sweetalert2";
import {
  abiERC20,
  formatAddress,
  formatTokenAmount,
  getTransactionError,
  isValidAddress,
  parseTimestamp,
  parseTokenAmount,
} from "@/utils";

import type { VaultRegistryDetail } from "./shared/contractTypes";
import useWriteContracts from "./useWriteContracts";
import { useProtocolReads } from "./useProtocolReads";
import type { ProtocolReadDefinition } from "./useProtocolReads";
import useContractReadExecutor from "./useContractReadExecutor";
import { getReadContractResult } from "./shared/contractResults";
import { resolveProtocolContract } from "./protocolContracts";

type VaultDetailProtocolContext = {
  vaultAddress: Address | undefined;
};

const strategyActionCopy: Record<
  VaultStrategyAction,
  {
    title: string;
    confirmation: string;
  }
> = {
  0: {
    title: "Execute investment strategy",
    confirmation:
      "Confirm the investment strategy transaction in your wallet. The vault allocation will be routed across the selected adapters.",
  },
  1: {
    title: "Execute Divestment strategy",
    confirmation:
      "Confirm the Divestment strategy transaction in your wallet. The vault allocation will be routed across the selected adapters.",
  },
};

const vaultDetailProtocolDefinitions: ProtocolReadDefinition<
  "vaultDetail" | "isVaultDepositsPaused" | "isExecutionPaused",
  VaultDetailProtocolContext
>[] = [
  {
    key: "vaultDetail",
    contract: "getVaultRegistryContract",
    functionName: "getVaultDetail",
    args: (context) =>
      context.vaultAddress ? [context.vaultAddress] : undefined,
  },
  {
    key: "isVaultDepositsPaused",
    contract: "getProtocolCoreContract",
    functionName: "isVaultDepositsPaused",
  },
  {
    key: "isExecutionPaused",
    contract: "getRiskManagerContract",
    functionName: "executionPaused",
  },
];

export function useVaultDetailModel(
  vaultAddress?: string,
  strategyAllocations: VaultStrategyAllocationInput[] = [],
): VaultDetailModel {
  const chainId = useChainId();
  const capabilities = useProtocolCapabilities();
  const connection = useConnection();
  const { executeRead } = useContractReadExecutor();
  const { executeWrite } = useWriteContracts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vaultDecimalsValue, setVaultDecimals] = useState<number | undefined>();
  const [mintedShares, setMintedShares] = useState<bigint | undefined>();
  const [maxWithdraw, setMaxWithdraw] = useState<bigint | undefined>();
  const [maxRedeem, setMaxRedeem] = useState<bigint | undefined>();
  const [totalAssets, setTotalAssets] = useState<bigint | undefined>();
  const [depositedAssets, setDepositedAssets] = useState<bigint | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const toBigIntValue = (value: unknown): bigint => {
    if (typeof value === "bigint") {
      return value;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return BigInt(Math.trunc(value));
    }

    if (typeof value === "string" && value.trim() !== "") {
      return BigInt(value);
    }

    return 0n;
  };

  const resolvedVaultAddress = useMemo(
    () =>
      vaultAddress && isValidAddress(vaultAddress)
        ? (vaultAddress as Address)
        : undefined,
    [vaultAddress],
  );

  const vaultDetailProtocolContext: VaultDetailProtocolContext = {
    vaultAddress: resolvedVaultAddress,
  };

  const {
    vaultDetail,
    isVaultDepositsPaused,
    isExecutionPaused,
    refetch: refetchProtocol,
  } = useProtocolReads(
    vaultDetailProtocolDefinitions,
    vaultDetailProtocolContext,
  );

  const vaultDetailTyped = vaultDetail as VaultRegistryDetail | undefined;
  const isVaultDepositsPausedTyped =
    (isVaultDepositsPaused as boolean) ?? false;
  const isExecutionPausedTyped = (isExecutionPaused as boolean) ?? false;

  const assetDefinitions: ProtocolReadDefinition<'assetSymbol' | 'assetDecimals' | 'assetBalance'>[] = vaultDetailTyped?.asset ? [
    {
      key: 'assetSymbol',
      contract: { abi: abiERC20, address: vaultDetailTyped.asset },
      functionName: 'symbol',
    },
    {
      key: 'assetDecimals',
      contract: { abi: abiERC20, address: vaultDetailTyped.asset },
      functionName: 'decimals',
    },
    {
      key: 'assetBalance',
      contract: { abi: abiERC20, address: vaultDetailTyped.asset },
      functionName: 'balanceOf',
      args: connection.address ? [connection.address] : undefined,
    },
  ] : [];

  const assetReads = useProtocolReads(assetDefinitions);

  const strategyRouterConfig = useMemo(
    () => resolveProtocolContract(chainId, "getStrategyRouterContract"),
    [chainId],
  );

  const { data: strategyRouterAdaptersData } = useReadContracts({
    allowFailure: true,
    contracts:
      strategyRouterConfig && resolvedVaultAddress
        ? [
            {
              abi: strategyRouterConfig.abi,
              address: strategyRouterConfig.address,
              functionName: "getAllowedAdapters" as const,
            },
          ]
        : [],
    query: {
      enabled: Boolean(strategyRouterConfig && resolvedVaultAddress),
    },
  });

  const strategyRouterAdapters = useMemo(() => {
    return (
      (getReadContractResult<readonly Address[] | Address[]>(
        strategyRouterAdaptersData?.[0],
      ) ?? []) as Address[]
    ).map((adapter) => adapter.toLowerCase());
  }, [strategyRouterAdaptersData]);

  const strategyAllocationReadContracts = useMemo(() => {
    if (!strategyRouterConfig) {
      return [];
    }

    return strategyAllocations.flatMap((allocation) =>
      isValidAddress(allocation.adapter.trim())
        ? [
            {
              abi: strategyRouterConfig.abi,
              address: strategyRouterConfig.address,
              functionName: "isAdapterAllowed" as const,
              args: [allocation.adapter.trim() as Address],
            },
          ]
        : [],
    );
  }, [strategyAllocations, strategyRouterConfig]);

  const { data: strategyAllocationAllowedData } = useReadContracts({
    allowFailure: true,
    contracts: strategyAllocationReadContracts,
    query: {
      enabled: strategyAllocationReadContracts.length > 0,
    },
  });

  const strategyAllocationAdapterCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const allocation of strategyAllocations) {
      const adapter = allocation.adapter.trim().toLowerCase();
      if (!adapter || !isValidAddress(adapter)) {
        continue;
      }

      counts.set(adapter, (counts.get(adapter) ?? 0) + 1);
    }

    return counts;
  }, [strategyAllocations]);

  const strategyAllocationStatuses = useMemo(() => {
    let readIndex = 0;

    return strategyAllocations.map((allocation) => {
      const adapter = allocation.adapter.trim();
      const normalizedAdapter = adapter.toLowerCase();
      const percentage = allocation.percentage.trim();
      const isAdapterValid = adapter !== "" && isValidAddress(adapter);
      const isDuplicateAdapter =
        isAdapterValid &&
        (strategyAllocationAdapterCounts.get(normalizedAdapter) ?? 0) > 1;
      const percentageValue = Number(percentage);
      const hasPercentage = percentage !== "";
      const isPercentageValid =
        hasPercentage &&
        Number.isInteger(percentageValue) &&
        percentageValue > 0;
      const readResult = isAdapterValid
        ? strategyAllocationAllowedData?.[readIndex++]
        : undefined;
      const isQueryLoaded = isAdapterValid ? readResult !== undefined : false;
      const isAdapterAllowed = isAdapterValid
        ? getReadContractResult<boolean>(readResult) ?? false
        : false;
      const isValidationPending =
        isAdapterValid && isPercentageValid && !isQueryLoaded;
      const isComplete =
        isAdapterValid &&
        isPercentageValid &&
        !isDuplicateAdapter &&
        isQueryLoaded &&
        isAdapterAllowed;

      let error: string | undefined;

      if (adapter === "" && percentage === "") {
        error = "Add an adapter address and its percentage.";
      } else if (!isAdapterValid) {
        error = "Enter a valid adapter address.";
      } else if (isDuplicateAdapter) {
        error = "Duplicate adapters are not allowed.";
      } else if (!isPercentageValid) {
        error = "Enter a percentage greater than 0.";
      } else if (isValidationPending) {
        error = "Validating adapter in StrategyRouter...";
      } else if (isQueryLoaded && !isAdapterAllowed) {
        error = "Adapter is not enabled in StrategyRouter.";
      }

      return {
        adapter,
        percentage,
        isAdapterValid,
        isAdapterAllowed,
        isQueryLoaded,
        isComplete,
        isValidationPending,
        error,
      };
    });
  }, [strategyAllocations, strategyAllocationAllowedData, strategyAllocationAdapterCounts]);

  const strategyAllocationTotal = useMemo(
    () =>
      strategyAllocationStatuses.reduce((total, row) => {
        const value = Number(row.percentage);
        return Number.isFinite(value) && value > 0 ? total + value : total;
      }, 0),
    [strategyAllocationStatuses],
  );

  const strategyExecutionMessage = useMemo(() => {
    if (strategyAllocationStatuses.length === 0) {
      return "Add at least one adapter allocation to execute the strategy.";
    }

    const incompleteRow = strategyAllocationStatuses.find(
      (row) => !row.isComplete,
    );
    if (incompleteRow?.error) {
      return incompleteRow.error;
    }

    if (strategyAllocationTotal > 100) {
      return "The total allocation cannot exceed 100%.";
    }

    if (strategyAllocationTotal < 100) {
      return "The total allocation must equal 100% before execution.";
    }

    return undefined;
  }, [strategyAllocationStatuses, strategyAllocationTotal]);

  const strategyExecutionReady =
    strategyAllocationStatuses.length > 0 &&
    strategyAllocationStatuses.every((row) => row.isComplete) &&
    strategyAllocationTotal === 100;

  useEffect(() => {
    if (resolvedVaultAddress && connection.address) {
      return;
    }

    setVaultDecimals(undefined);
    setMintedShares(undefined);
    setMaxWithdraw(undefined);
    setMaxRedeem(undefined);
    setTotalAssets(undefined);
    setDepositedAssets(undefined);
  }, [resolvedVaultAddress, connection.address]);

  // Fetch vault data using executeRead
  useEffect(() => {
    if (!resolvedVaultAddress || !connection.address) return;
    let isActive = true;

    const fetchVaultData = async () => {
      try {
        const decimals = await executeRead({
          functionName: "decimals",
          functionContract: "getVaultImplementationContract",
          args: [],
          address: resolvedVaultAddress,
        });
        if (!isActive) return;
        setVaultDecimals(Number(toBigIntValue(decimals)));

        const shares = await executeRead({
          functionName: "balanceOf",
          functionContract: "getVaultImplementationContract",
          args: [connection.address],
          address: resolvedVaultAddress,
        });
        if (!isActive) return;
        setMintedShares(toBigIntValue(shares));

        const maxW = await executeRead({
          functionName: "maxWithdraw",
          functionContract: "getVaultImplementationContract",
          args: [connection.address],
          address: resolvedVaultAddress,
        });
        if (!isActive) return;
        setMaxWithdraw(toBigIntValue(maxW));

        const maxR = await executeRead({
          functionName: "maxRedeem",
          functionContract: "getVaultImplementationContract",
          args: [connection.address],
          address: resolvedVaultAddress,
        });
        if (!isActive) return;
        setMaxRedeem(toBigIntValue(maxR));

        const totalA = await executeRead({
          functionName: "totalAssets",
          functionContract: "getVaultImplementationContract",
          args: [],
          address: resolvedVaultAddress,
        });
        if (!isActive) return;
        setTotalAssets(toBigIntValue(totalA));
      } catch (error) {
        console.error("Error fetching vault data:", error);
      }
    };

    void fetchVaultData();

    return () => {
      isActive = false;
    };
  }, [resolvedVaultAddress, connection.address, executeRead, refreshTrigger]);

  // Fetch preview data
  useEffect(() => {
    if (!resolvedVaultAddress || !mintedShares || mintedShares <= 0n) {
      setDepositedAssets(0n);
      return;
    }
    let isActive = true;

    const fetchPreviewData = async () => {
      try {
        const deposited = await executeRead({
          functionName: "previewRedeem",
          functionContract: "getVaultImplementationContract",
          args: [mintedShares],
          address: resolvedVaultAddress,
        });
        if (!isActive) return;
        setDepositedAssets(toBigIntValue(deposited));
      } catch (error) {
        console.error("Error fetching preview data:", error);
      }
    };

    void fetchPreviewData();

    return () => {
      isActive = false;
    };
  }, [resolvedVaultAddress, mintedShares, executeRead, refreshTrigger]);

  const mintedSharesValueTyped = mintedShares ?? 0n;

  // Extract values
  const assetSymbolTyped = assetReads.assetSymbol as string | undefined;
  const assetDecimalsTyped = assetReads.assetDecimals as number | undefined ?? 18;
  const assetBalanceTyped = assetReads.assetBalance as bigint | undefined ?? 0n;
  const vaultDecimalsTyped = vaultDecimalsValue ?? assetDecimalsTyped;
  const maxWithdrawValueTyped = maxWithdraw ?? 0n;
  const maxRedeemValueTyped = maxRedeem ?? 0n;
  const totalAssetsValueTyped = totalAssets ?? 0n;
  const depositedAssetsValueTyped = depositedAssets ?? 0n;

  // Assign to old variable names for compatibility
  const assetSymbol = assetSymbolTyped ?? (vaultDetailTyped?.asset ? formatAddress(vaultDetailTyped.asset) : "—");
  const assetDecimals = assetDecimalsTyped;
  const depositAssetBalanceValue = assetBalanceTyped;
  const depositAssetBalance = formatTokenAmount(
    depositAssetBalanceValue,
    assetSymbol === "—" ? undefined : assetSymbol,
    assetDecimals,
  );
  const hasDepositAssetBalance = depositAssetBalanceValue > 0n;
  const vaultDecimals = vaultDecimalsTyped;
  const mintedSharesValue = mintedSharesValueTyped;
  const maxWithdrawValue = maxWithdrawValueTyped;
  const maxRedeemValue = maxRedeemValueTyped;
  const totalAssetsValue = totalAssetsValueTyped;
  const depositedAssetsValue = depositedAssetsValueTyped;

  // Explicitly refresh total assets to ensure UI reflects on-chain changes
  const refreshTotalAssets = async () => {
    if (!resolvedVaultAddress) return;
    try {
      const totalA = await executeRead({
        functionName: "totalAssets",
        functionContract: "getVaultImplementationContract",
        args: [],
        address: resolvedVaultAddress,
      });
      setTotalAssets(toBigIntValue(totalA));
    } catch (error) {
      console.error("Error refreshing Vault Total Assets:", error);
    }
  };

  const refreshVaultData = async () => {
    await Promise.allSettled([
      refetchProtocol?.(),
      assetReads.refetch?.(),
    ]);
    // Also refresh total assets explicitly to guarantee UI consistency
    await refreshTotalAssets();
    setRefreshTrigger(prev => prev + 1);
  };

  const approveAssetForVault = async (amount: bigint) => {
    if (!vaultDetailTyped?.asset || !resolvedVaultAddress) return;

    return executeWrite({
      abi: abiERC20,
      address: vaultDetailTyped.asset,
      functionName: "approve",
      args: [resolvedVaultAddress, amount],
      options: { waitForReceipt: true },
    });
  };

  const executeVaultTransaction = async (
    title: string,
    description: string,
    transaction: () => Promise<unknown>,
  ): Promise<boolean> => {
    setIsSubmitting(true);

    Swal.fire({
      title,
      text: description,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await transaction();
      const typedResponse = response as
        | { receipt?: { status?: string } }
        | undefined;

      if (!typedResponse || typedResponse.receipt?.status !== "success") {
        throw new Error(`${title} transaction failed.`);
      }

      await refreshVaultData();
      Swal.close();

      await Swal.fire({
        title: `${title} successful`,
        text: "The vault state has been updated.",
        icon: "success",
        confirmButtonText: "OK",
      });
      return true;
    } catch (error) {
      const transactionError = getTransactionError(error);
      Swal.hideLoading();
      Swal.update({
        title: transactionError.title,
        text: transactionError.message,
        icon: "error",
        showConfirmButton: true,
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deposit = async (amount: string): Promise<boolean> => {
    if (
      !resolvedVaultAddress ||
      !connection.address ||
      !vaultDetailTyped?.asset
    )
      return false;

    const parsedAmount = parseTokenAmount(amount, assetDecimals);
    if (parsedAmount <= 0n) return false;

    return executeVaultTransaction(
      "Deposit assets",
      "Confirm the deposit transaction in your wallet.",
      async () => {
        const approval = await approveAssetForVault(parsedAmount);

        if (
          !approval ||
          !("receipt" in approval) ||
          approval.receipt?.status !== "success"
        ) {
          throw new Error("Token approval failed.");
        }

        const contract = resolveProtocolContract(chainId, "getVaultImplementationContract");
        if (!contract) throw new Error("Vault implementation contract not found");

        return executeWrite({
          abi: contract.abi,
          address: resolvedVaultAddress,
          functionName: "deposit",
          args: [parsedAmount, connection.address as Address],
          options: { waitForReceipt: true },
        });
      },
    );
  };

  const mint = async (amount: string): Promise<boolean> => {
    if (
      !resolvedVaultAddress ||
      !connection.address ||
      !vaultDetailTyped?.asset
    )
      return false;

    const parsedShares = parseTokenAmount(amount, vaultDecimals);
    if (parsedShares <= 0n) return false;

    return executeVaultTransaction(
      "Mint shares",
      "Confirm the mint transaction in your wallet.",
      async () => {
        const approval = await approveAssetForVault(parsedShares);

        if (
          !approval ||
          !("receipt" in approval) ||
          approval.receipt?.status !== "success"
        ) {
          throw new Error("Token approval failed.");
        }

        const contract = resolveProtocolContract(chainId, "getVaultImplementationContract");
        if (!contract) throw new Error("Vault implementation contract not found");

        return executeWrite({
          abi: contract.abi,
          address: resolvedVaultAddress,
          functionName: "mint",
          args: [parsedShares, connection.address as Address],
          options: { waitForReceipt: true },
        });
      },
    );
  };

  const withdraw = async (amount: string): Promise<boolean> => {
    if (!resolvedVaultAddress || !connection.address) return false;

    const parsedAmount = parseTokenAmount(amount, assetDecimals);
    if (parsedAmount <= 0n) return false;

    return executeVaultTransaction(
      "Withdraw assets",
      "Confirm the withdraw transaction in your wallet.",
      async () => {
        const contract = resolveProtocolContract(chainId, "getVaultImplementationContract");
        if (!contract) throw new Error("Vault implementation contract not found");

        return executeWrite({
          abi: contract.abi,
          address: resolvedVaultAddress,
          functionName: "withdraw",
          args: [
            parsedAmount,
            connection.address as Address,
            connection.address as Address,
          ],
          options: { waitForReceipt: true },
        });
      },
    );
  };

  const redeem = async (amount: string): Promise<boolean> => {
    if (!resolvedVaultAddress || !connection.address) return false;

    const parsedShares = parseTokenAmount(amount, vaultDecimals);
    if (parsedShares <= 0n) return false;

    return executeVaultTransaction(
      "Redeem shares",
      "Confirm the redeem transaction in your wallet.",
      async () => {
        const contract = resolveProtocolContract(chainId, "getVaultImplementationContract");
        if (!contract) throw new Error("Vault implementation contract not found");

        return executeWrite({
          abi: contract.abi,
          address: resolvedVaultAddress,
          functionName: "redeem",
          args: [
            parsedShares,
            connection.address as Address,
            connection.address as Address,
          ],
          options: { waitForReceipt: true },
        });
      },
    );
  };

  const executeStrategy = async (
    action: VaultStrategyAction,
  ): Promise<boolean> => {
    if (!resolvedVaultAddress || !strategyRouterConfig) {
      await Swal.fire({
        title: "Strategy execution unavailable",
        text: "The StrategyRouter contract is unavailable for this network.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return false;
    }

    if (!capabilities.canExecuteStrategy || !isVaultGuardian) {
      await Swal.fire({
        title: "Guardian access required",
        text: "Only the guardian assigned to this vault can execute the strategy.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return false;
    }

    if (!vaultDetailTyped?.active || isExecutionPausedTyped) {
      await Swal.fire({
        title: "Strategy execution restricted",
        text: "Execution is currently restricted by vault status or risk controls.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return false;
    }

    if (!strategyExecutionReady) {
      await Swal.fire({
        title: "Strategy allocation incomplete",
        text:
          strategyExecutionMessage ??
          "Fill all adapter rows and make sure the allocation totals 100%.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return false;
    }

    const adapters = strategyAllocationStatuses.map(
      (allocation) => allocation.adapter.trim() as Address,
    );
    const percentages = strategyAllocationStatuses.map((allocation) =>
      BigInt(allocation.percentage.trim()),
    );

    return executeVaultTransaction(
      strategyActionCopy[action].title,
      strategyActionCopy[action].confirmation,
      async () => {
        const contract = resolveProtocolContract(
          chainId,
          "getVaultImplementationContract",
        );
        if (!contract) throw new Error("Vault implementation contract not found");

        return executeWrite({
          abi: contract.abi,
          address: resolvedVaultAddress,
          functionName: action === 0 ? "executeStrategy" : "divestStrategy",
          args: action === 0 ? [adapters, percentages, action] : undefined,
          options: { waitForReceipt: true },
        });
      },
    );
  };

  const isVaultGuardian = useMemo(
    () =>
      Boolean(
        connection.address &&
        vaultDetailTyped?.guardian &&
        connection.address.toLowerCase() ===
          vaultDetailTyped.guardian.toLowerCase(),
      ),
    [connection.address, vaultDetailTyped?.guardian],
  );

  const canShowGuardianOperations =
    capabilities.canAccessGuardianOperations && isVaultGuardian;

  const vault: VaultDetailData = {
    address: resolvedVaultAddress ?? vaultAddress ?? "—",
    asset: assetSymbol,
    guardian: vaultDetailTyped?.guardian ?? "—",
    status: vaultDetailTyped?.active ? "Active" : "Inactive",
    registeredAt:
      vaultDetailTyped?.registeredAt != null
        ? parseTimestamp(Number(vaultDetailTyped.registeredAt))
            .toISOString()
            .slice(0, 10)
        : "—",
    decimals: vaultDecimals,
    totalAssets: formatTokenAmount(
      totalAssetsValue,
      assetSymbol === "—" ? undefined : assetSymbol,
      assetDecimals,
    ),
  };

  const position: VaultDetailPosition = {
    depositedAssets: formatTokenAmount(
      depositedAssetsValue,
      assetSymbol === "—" ? undefined : assetSymbol,
      assetDecimals,
    ),
    mintedShares: formatTokenAmount(
      mintedSharesValue,
      undefined,
      vaultDecimals,
    ),
    withdrawableAssets: formatTokenAmount(
      maxWithdrawValue,
      assetSymbol === "—" ? undefined : assetSymbol,
      assetDecimals,
    ),
    redeemableShares: formatTokenAmount(
      maxRedeemValue,
      undefined,
      vaultDecimals,
    ),
  };

  const controls: VaultDetailControls = {
    depositsEnabled:
      !isVaultDepositsPausedTyped && vaultDetailTyped?.active === true,
    strategyExecutionEnabled:
      !isExecutionPausedTyped && vaultDetailTyped?.active === true,
  };

  return {
    vault,
    position,
    controls,
    strategyRouterAdapters,
    strategyAllocationStatuses,
    strategyExecutionMessage,
    strategyExecutionReady,
    capabilities,
    isSubmitting,
    depositAssetBalance,
    hasDepositAssetBalance,
    isVaultGuardian,
    canShowGuardianOperations,
    deposit,
    mint,
    withdraw,
    redeem,
    executeStrategy,
  };
}
