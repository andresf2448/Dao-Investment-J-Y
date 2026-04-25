import type { Address } from "viem";
import { vaultFactoryAbi } from "@/constants/abi/vaultFactory";

const vaultFactoryAddresses: Record<number, Address> = {
  31337: "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f",
};

export function getVaultFactoryContract(chainId: number) {
  const address = vaultFactoryAddresses[chainId];

  if (!address) {
    throw new Error("VaultFactory no desplegado en chainId " + chainId);
  }

  return {
    address,
    abi: vaultFactoryAbi,
  } as const;
}
