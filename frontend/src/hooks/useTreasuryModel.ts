import { getTreasuryContract } from "@dao/contracts-sdk";
import { useMemo } from "react";
import { useChainId, useReadContracts } from "wagmi";
import { formatTokenAmount } from "@/utils";
import type {
  TreasuryAsset,
  TreasuryMetrics,
  TreasuryModel,
} from "@/types/treasury";
import type { AssetCategory, AssetVisibility } from "@/types/treasury";
import { useProtocolCapabilities } from "./useProtocolCapabilities";
import { getReadContractResult } from "./shared/contractResults";
import { resolveOptionalContract } from "./shared/resolveContract";
import { useSupportedGenesisAssets } from "./shared/useSupportedGenesisAssets";

export function useTreasuryModel(): TreasuryModel {
  const chainId = useChainId();
  const capabilities = useProtocolCapabilities();
  const { supportedGenesisAssets } = useSupportedGenesisAssets();

  const treasuryConfig = useMemo(() => {
    return resolveOptionalContract(chainId, getTreasuryContract);
  }, [chainId]);

  const treasuryReadContracts = useMemo(() => {
    if (!treasuryConfig) {
      return [];
    }

    return [
      ...supportedGenesisAssets.map((asset) => ({
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
  }, [supportedGenesisAssets, treasuryConfig]);

  const { data: treasuryBalancesData } = useReadContracts({
    allowFailure: true,
    contracts: treasuryReadContracts,
    query: {
      enabled: Boolean(treasuryConfig),
    },
  });

  const nativeBalance =
    getReadContractResult<bigint>(
      treasuryBalancesData?.[supportedGenesisAssets.length],
    ) ?? 0n;

  const assets = useMemo<TreasuryAsset[]>(() => {
    return supportedGenesisAssets.map((asset, index) => {
      const rawBalance =
        getReadContractResult<bigint>(treasuryBalancesData?.[index]) ?? 0n;
      const category: AssetCategory = "DAO Asset";
      const visibility: AssetVisibility = treasuryConfig ? "Tracked" : "Unavailable";

      return {
        token: asset.symbol,
        type: "ERC20" as const,
        balance: formatTokenAmount(rawBalance, asset.symbol, asset.decimals),
        category,
        visibility,
      };
    });
  }, [supportedGenesisAssets, treasuryBalancesData, treasuryConfig]);

  const daoAssetCount = assets.filter((asset) => asset.category === "DAO Asset").length;

  const metrics: TreasuryMetrics = {
    trackedErc20Assets: supportedGenesisAssets.length,
    daoAssetExposure: `${daoAssetCount} DAO asset${daoAssetCount === 1 ? "" : "s"} tracked`,
    operationalLiquidity:
      treasuryConfig && supportedGenesisAssets.length > 0 ? "Tracked" : "Unavailable",
    nativeReserve: formatTokenAmount(nativeBalance, "ETH", 18),
  };

  return {
    assets,
    metrics,
    capabilities,
  };
}
