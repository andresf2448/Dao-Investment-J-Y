import { vaultFactoryAbi } from "@/constants/abi/vaultFactory";
import { VAULT_FACTORY_ADDRESSES } from "@/constants";

export function getVaultFactoryContract(chainId: number) {
  const address = VAULT_FACTORY_ADDRESSES[chainId];

  if (!address) {
    throw new Error("VaultFactory no desplegado en chainId " + chainId);
  }

  return {
    address,
    abi: vaultFactoryAbi,
  } as const;
}
