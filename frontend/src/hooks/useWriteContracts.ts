import { useCallback } from "react";
import type {
  Abi,
  Address,
  Hash,
  WaitForTransactionReceiptReturnType,
} from "viem";
import { useChainId, useWriteContract } from "wagmi";
import { getPublicClient } from "@/lib";
import {
  type ProtocolContractGetterName,
  resolveProtocolContract,
} from "./protocolContracts";

export type ExecuteOptions = {
  waitForReceipt?: boolean;
  confirmations?: number;
};

export type ExecuteResult = {
  hash: Hash;
  receipt?: WaitForTransactionReceiptReturnType;
};

export type ExecuteWriteWithProtocolContractParams = {
  functionName: string;
  functionContract: ProtocolContractGetterName;
  args?: readonly unknown[];
  options?: ExecuteOptions;
};

export type ExecuteWriteWithCustomContractParams = {
  functionName: string;
  abi: Abi;
  address: Address;
  args?: readonly unknown[];
  options?: ExecuteOptions;
};

export type ExecuteWriteParams =
  | ExecuteWriteWithProtocolContractParams
  | ExecuteWriteWithCustomContractParams;

type ResolvedWriteContract = {
  abi: Abi;
  address: Address;
};

function hasProtocolContract(
  params: ExecuteWriteParams,
): params is ExecuteWriteWithProtocolContractParams {
  return "functionContract" in params;
}

function resolveWriteContract(
  chainId: number,
  params: ExecuteWriteParams,
): ResolvedWriteContract | undefined {
  if (hasProtocolContract(params)) {
    const resolvedContract = resolveProtocolContract(
      chainId,
      params.functionContract,
    );

    if (!resolvedContract) {
      return undefined;
    }

    return {
      abi: resolvedContract.abi,
      address: resolvedContract.address,
    };
  }

  if (!params.abi?.length) {
    return undefined;
  }

  return {
    abi: params.abi,
    address: params.address,
  };
}

const useWriteContracts = () => {
  const chainId = useChainId();
  const writeContract = useWriteContract();

  const executeWrite = useCallback(
    async (params: ExecuteWriteParams): Promise<ExecuteResult | undefined> => {
      if (!chainId) {
        return undefined;
      }

      const resolvedContract = resolveWriteContract(chainId, params);

      if (!resolvedContract) {
        return undefined;
      }

      const hash = await writeContract.mutateAsync({
        abi: resolvedContract.abi,
        address: resolvedContract.address,
        functionName: params.functionName,
        args: [...(params.args ?? [])],
      });

      if (!params.options?.waitForReceipt) {
        return { hash };
      }

      const publicClient = getPublicClient(chainId);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: params.options.confirmations ?? 1,
      });

      return { hash, receipt };
    },
    [chainId, writeContract],
  );

  return {
    executeWrite,
  };
};

export default useWriteContracts;
