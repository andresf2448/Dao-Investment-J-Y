import { useMemo } from "react";
import { type Address } from "viem";
import { useReadContracts } from "wagmi";
import { abiERC20, formatAddress } from "@/utils";
import { getReadContractResult } from "./contractResults";
import {
  DEFAULT_TOKEN_DECIMALS,
  normalizeTokenDecimals,
} from "./formatting";
import { useProtocolReads } from "../useProtocolReads";
import type { KnownProtocolAsset } from "@/constants/protocolAssets";

export function useSupportedGenesisAssets() {
  const { assetsSupported } = useProtocolReads([
    {
      key: "assetsSupported",
      contract: "getProtocolCoreContract",
      functionName: "getSupportedGenesisTokens",
    },
  ]);

  const supportedGenesisTokens = useMemo<Address[]>(() => {
    const tokens = (assetsSupported as readonly Address[] | undefined) ?? [];

    return tokens.filter(
      (token, index, self) =>
        self.findIndex(
          (candidate) => candidate.toLowerCase() === token.toLowerCase(),
        ) === index,
    );
  }, [assetsSupported]);

  const assetMetadataContracts = useMemo(
    () =>
      supportedGenesisTokens.flatMap((assetAddress) => [
        {
          abi: abiERC20,
          address: assetAddress,
          functionName: "symbol" as const,
        },
        {
          abi: abiERC20,
          address: assetAddress,
          functionName: "decimals" as const,
        },
      ]),
    [supportedGenesisTokens],
  );

  const { data: assetMetadataData } = useReadContracts({
    allowFailure: true,
    contracts: assetMetadataContracts,
    query: {
      enabled: assetMetadataContracts.length > 0,
    },
  });

  const supportedGenesisAssets = useMemo<KnownProtocolAsset[]>(() => {
    return supportedGenesisTokens.map((assetAddress, index) => {
      const symbolResult = getReadContractResult<string>(
        assetMetadataData?.[index * 2],
      );
      const decimalsResult = getReadContractResult<number | bigint | string>(
        assetMetadataData?.[index * 2 + 1],
      );

      const decimals =
        normalizeTokenDecimals(decimalsResult) ?? DEFAULT_TOKEN_DECIMALS;

      return {
        symbol: symbolResult?.trim() || formatAddress(assetAddress),
        address: assetAddress,
        decimals,
      };
    });
  }, [assetMetadataData, supportedGenesisTokens]);

  return {
    supportedGenesisAssets,
    supportedGenesisTokens,
  };
}
