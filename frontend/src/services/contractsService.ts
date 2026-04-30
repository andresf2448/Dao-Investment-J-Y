import type { Abi, Address } from "viem";
import { getPublicClient } from "@/lib";
import {
  type ContractReferenceWithOptionalAddress,
  resolveContract,
} from "@/hooks/shared/resolveContract";

export type ContractCallParams = ContractReferenceWithOptionalAddress & {
  chainId: number;
  functionName: string;
  args?: readonly unknown[];
  account?: Address;
};

export async function readContractCall({
  chainId,
  functionName,
  args,
  account,
  ...contract
}: ContractCallParams) {
  const resolvedContract = resolveContract(chainId, contract);

  if (!resolvedContract) {
    return undefined;
  }

  const publicClient = getPublicClient(chainId);

  return await publicClient.readContract({
    abi: resolvedContract.abi,
    address: resolvedContract.address,
    functionName,
    args,
    account,
  } as {
    abi: Abi;
    address: Address;
    functionName: string;
    args?: readonly unknown[];
    account?: Address;
  });
}

export async function simulateContractCall({
  chainId,
  functionName,
  args,
  account,
  ...contract
}: ContractCallParams) {
  const resolvedContract = resolveContract(chainId, contract);

  if (!resolvedContract) {
    return undefined;
  }

  const publicClient = getPublicClient(chainId);

  return await publicClient.simulateContract({
    abi: resolvedContract.abi,
    address: resolvedContract.address,
    functionName,
    args,
    account,
  } as {
    abi: Abi;
    address: Address;
    functionName: string;
    args?: readonly unknown[];
    account?: Address;
  });
}
