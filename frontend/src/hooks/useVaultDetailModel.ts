import {
  getProtocolCoreContract,
  getRiskManagerContract,
  getVaultRegistryContract,
} from "@dao/contracts-sdk";
import { useMemo } from "react";
import { useChainId, useConnection, useReadContracts } from "wagmi";
import type { Address } from "viem";
import type {
  VaultDetailControls,
  VaultDetailData,
  VaultDetailModel,
  VaultDetailPosition,
} from "@/types/models/vaultDetail";
import { useProtocolCapabilities } from "./useProtocolCapabilities";
import {
  abiERC20,
  formatAddress,
  formatTokenAmount,
  isValidAddress,
  parseTimestamp,
} from "@/utils";
import { getReadContractResult } from "./shared/contractResults";
import type { VaultRegistryDetail } from "./shared/contractTypes";
import { resolveOptionalContract } from "./shared/resolveContract";

const vaultReadAbi = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "maxWithdraw",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "maxRedeem",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "previewRedeem",
    stateMutability: "view",
    inputs: [{ name: "shares", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export function useVaultDetailModel(vaultAddress?: string): VaultDetailModel {
  const chainId = useChainId();
  const capabilities = useProtocolCapabilities();
  const connection = useConnection();

  const resolvedVaultAddress = useMemo(
    () =>
      vaultAddress && isValidAddress(vaultAddress)
        ? (vaultAddress as Address)
        : undefined,
    [vaultAddress],
  );

  const vaultRegistryConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getVaultRegistryContract);
  }, [chainId]);

  const protocolCoreConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getProtocolCoreContract);
  }, [chainId]);

  const riskManagerConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getRiskManagerContract);
  }, [chainId]);

  const { data: registryAndControlData } = useReadContracts({
    allowFailure: true,
    contracts:
      resolvedVaultAddress &&
      vaultRegistryConfig &&
      protocolCoreConfig &&
      riskManagerConfig
        ? [
            {
              abi: vaultRegistryConfig.abi,
              address: vaultRegistryConfig.address,
              functionName: "getVaultDetail",
              args: [resolvedVaultAddress],
            },
            {
              abi: protocolCoreConfig.abi,
              address: protocolCoreConfig.address,
              functionName: "isVaultDepositsPaused",
            },
            {
              abi: riskManagerConfig.abi,
              address: riskManagerConfig.address,
              functionName: "executionPaused",
            },
          ]
        : [],
    query: {
      enabled: Boolean(
        resolvedVaultAddress &&
          vaultRegistryConfig &&
          protocolCoreConfig &&
          riskManagerConfig,
      ),
    },
  });

  const vaultDetail = getReadContractResult<VaultRegistryDetail>(
    registryAndControlData?.[0],
  );
  const isVaultDepositsPaused =
    getReadContractResult<boolean>(registryAndControlData?.[1]) ?? false;
  const isExecutionPaused =
    getReadContractResult<boolean>(registryAndControlData?.[2]) ?? false;

  const { data: assetMetadataData } = useReadContracts({
    allowFailure: true,
    contracts: vaultDetail?.asset
      ? [
          {
            abi: abiERC20,
            address: vaultDetail.asset,
            functionName: "symbol",
          },
          {
            abi: abiERC20,
            address: vaultDetail.asset,
            functionName: "decimals",
          },
        ]
      : [],
    query: {
      enabled: Boolean(vaultDetail?.asset),
    },
  });

  const assetSymbol =
    getReadContractResult<string>(assetMetadataData?.[0]) ??
    (vaultDetail?.asset ? formatAddress(vaultDetail.asset) : "—");
  const assetDecimals =
    getReadContractResult<number>(assetMetadataData?.[1]) ?? 18;

  const { data: vaultAccountData } = useReadContracts({
    allowFailure: true,
    contracts:
      resolvedVaultAddress && connection.address
        ? [
            {
              abi: vaultReadAbi,
              address: resolvedVaultAddress,
              functionName: "decimals",
            },
            {
              abi: vaultReadAbi,
              address: resolvedVaultAddress,
              functionName: "balanceOf",
              args: [connection.address as Address],
            },
            {
              abi: vaultReadAbi,
              address: resolvedVaultAddress,
              functionName: "maxWithdraw",
              args: [connection.address as Address],
            },
            {
              abi: vaultReadAbi,
              address: resolvedVaultAddress,
              functionName: "maxRedeem",
              args: [connection.address as Address],
            },
          ]
        : resolvedVaultAddress
          ? [
              {
                abi: vaultReadAbi,
                address: resolvedVaultAddress,
                functionName: "decimals",
              },
            ]
          : [],
    query: {
      enabled: Boolean(resolvedVaultAddress),
    },
  });

  const vaultDecimals = getReadContractResult<number>(vaultAccountData?.[0]) ?? assetDecimals;
  const mintedSharesValue = getReadContractResult<bigint>(vaultAccountData?.[1]) ?? 0n;
  const maxWithdrawValue = getReadContractResult<bigint>(vaultAccountData?.[2]) ?? 0n;
  const maxRedeemValue = getReadContractResult<bigint>(vaultAccountData?.[3]) ?? 0n;

  const { data: previewRedeemData } = useReadContracts({
    allowFailure: true,
    contracts:
      resolvedVaultAddress && connection.address
        ? [
            {
              abi: vaultReadAbi,
              address: resolvedVaultAddress,
              functionName: "previewRedeem",
              args: [mintedSharesValue],
            },
          ]
        : [],
    query: {
      enabled: Boolean(resolvedVaultAddress && connection.address),
    },
  });

  const depositedAssetsValue =
    getReadContractResult<bigint>(previewRedeemData?.[0]) ?? 0n;

  const vault: VaultDetailData = {
    address: resolvedVaultAddress ?? vaultAddress ?? "—",
    asset: assetSymbol,
    guardian: vaultDetail?.guardian ?? "—",
    status: vaultDetail?.active ? "Active" : "Inactive",
    registeredAt:
      vaultDetail?.registeredAt != null
        ? parseTimestamp(Number(vaultDetail.registeredAt))
            .toISOString()
            .slice(0, 10)
        : "—",
    decimals: vaultDecimals,
  };

  const position: VaultDetailPosition = {
    depositedAssets: formatTokenAmount(
      depositedAssetsValue,
      assetSymbol === "—" ? undefined : assetSymbol,
      assetDecimals,
    ),
    mintedShares: formatTokenAmount(mintedSharesValue, undefined, vaultDecimals),
    withdrawableAssets: formatTokenAmount(
      maxWithdrawValue,
      assetSymbol === "—" ? undefined : assetSymbol,
      assetDecimals,
    ),
    redeemableShares: formatTokenAmount(maxRedeemValue, undefined, vaultDecimals),
  };

  const controls: VaultDetailControls = {
    depositsEnabled: !isVaultDepositsPaused && vaultDetail?.active === true,
    strategyExecutionEnabled: !isExecutionPaused && vaultDetail?.active === true,
  };

  return {
    vault,
    position,
    controls,
    capabilities,
  };
}
