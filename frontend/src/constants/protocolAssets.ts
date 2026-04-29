import type { Address } from "viem";

export type KnownProtocolAsset = {
  address: Address;
  symbol: string;
  decimals: number;
};

const protocolAssetsByChainId: Record<number, KnownProtocolAsset[]> = {
  31337: [
    {
      address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      symbol: "USDT",
      decimals: 18,
    },
    {
      address: "0xD84379CEae14AA33C123Af12424A37803F885889",
      symbol: "USDC",
      decimals: 18,
    },
    {
      address: "0x8fC8CFB7f7362E44E472c690A6e025B80E406458",
      symbol: "TEST",
      decimals: 18,
    }
  ],
};

export function getKnownProtocolAssets(chainId: number): KnownProtocolAsset[] {
  return protocolAssetsByChainId[chainId] ?? [];
}
