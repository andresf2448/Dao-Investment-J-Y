import { getProtocolCoreContract, getTreasuryContract } from "@dao/contracts-sdk";
import { useMemo } from "react";
import { useChainId, useReadContracts } from "wagmi";
import { getKnownProtocolAssets } from "@/constants/protocolAssets";
import { formatTokenAmount } from "@/utils";
import type {
  TreasuryAsset,
  TreasuryMetrics,
  TreasuryModel,
} from "@/types/treasury";
import { useProtocolCapabilities } from "./useProtocolCapabilities";
import { getReadContractResult } from "./shared/contractResults";
import { resolveOptionalContract } from "./shared/resolveContract";

export function useTreasuryModel(): TreasuryModel {
  const chainId = useChainId();
  const capabilities = useProtocolCapabilities();

  const treasuryConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getTreasuryContract);
  }, [chainId]);

  const protocolCoreConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getProtocolCoreContract);
  }, [chainId]);

  const knownAssets = useMemo(() => getKnownProtocolAssets(chainId), [chainId]);

  const { data: supportedGenesisTokensData } = useReadContracts({
    allowFailure: true,
    contracts: protocolCoreConfig
      ? [
          {
            abi: protocolCoreConfig.abi,
            address: protocolCoreConfig.address,
            functionName: "getSupportedGenesisTokens" as const,
          },
        ]
      : [],
    query: {
      enabled: Boolean(protocolCoreConfig),
    },
  });

  const supportedGenesisTokens = useMemo(
    () =>
      (getReadContractResult<readonly `0x${string}`[]>(
        supportedGenesisTokensData?.[0],
      ) ?? []) as readonly `0x${string}`[],
    [supportedGenesisTokensData],
  );

  const treasuryReadContracts = useMemo(() => {
    if (!treasuryConfig) {
      return [];
    }

    return [
      ...knownAssets.map((asset) => ({
        abi: treasuryConfig.abi,
        address: treasuryConfig.address,
        functionName: "erc20Balance" as const,
        args: [asset.address],
      })),
      {
        abi: treasuryConfig.abi,
        address: treasuryConfig.address,
        functionName: "nativeBalance" as const,
      },
    ];
  }, [knownAssets, treasuryConfig]);

  const { data: treasuryBalancesData } = useReadContracts({
    allowFailure: true,
    contracts: treasuryReadContracts,
    query: {
      enabled: Boolean(treasuryConfig),
    },
  });

  const assets = useMemo<TreasuryAsset[]>(() => {
    const erc20Assets = knownAssets.map((asset, index) => {
      const rawBalance = getReadContractResult<bigint>(treasuryBalancesData?.[index]) ?? 0n;
      const isDaoAsset = supportedGenesisTokens.includes(asset.address);

      return {
        token: asset.symbol,
        type: "ERC20" as const,
        balance: formatTokenAmount(rawBalance, asset.symbol, asset.decimals),
        category: isDaoAsset ? "DAO Asset" : "Non-DAO Asset",
        visibility: treasuryConfig ? "Tracked" : "Unavailable",
      };
    });

    const nativeBalance = getReadContractResult<bigint>(
      treasuryBalancesData?.[knownAssets.length],
    ) ?? 0n;

    return [
      ...erc20Assets,
      {
        token: "ETH",
        type: "Native" as const,
        balance: formatTokenAmount(nativeBalance, "ETH", 18),
        category: "Native Asset",
        visibility: treasuryConfig ? "Tracked" : "Unavailable",
      },
    ];
  }, [knownAssets, supportedGenesisTokens, treasuryBalancesData, treasuryConfig]);

  const daoAssetCount = assets.filter((asset) => asset.category === "DAO Asset").length;
  const nativeBalance = assets.find((asset) => asset.type === "Native")?.balance ?? "—";

  const metrics: TreasuryMetrics = {
    trackedErc20Assets: knownAssets.length,
    daoAssetExposure: `${daoAssetCount} DAO asset${daoAssetCount === 1 ? "" : "s"} tracked`,
    operationalLiquidity:
      treasuryConfig && knownAssets.length > 0 ? "Tracked" : "Unavailable",
    nativeReserve: nativeBalance,
  };

  return {
    assets,
    metrics,
    capabilities,
  };
}
