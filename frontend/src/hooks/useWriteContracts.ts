import { useCallback } from "react";
import type {
  Hash,
  WaitForTransactionReceiptReturnType,
  Address,
} from "viem";
import { useChainId, useConnection, useWriteContract } from "wagmi";
import { getPublicClient } from "@/lib";
import { simulateContractCall } from "@/services/contractsService";
import {
  type ContractReferenceWithOptionalAddress,
  resolveContract,
} from "./shared/resolveContract";

export type ExecuteOptions = {
  waitForReceipt?: boolean;
  confirmations?: number;
  simulate?: boolean;
  simulationAccount?: Address;
};

export type ExecuteResult = {
  hash: Hash;
  receipt?: WaitForTransactionReceiptReturnType;
};

export type ExecuteWriteParams = ContractReferenceWithOptionalAddress & {
  functionName: string;
  args?: readonly unknown[];
  options?: ExecuteOptions;
};

const useWriteContracts = () => {
  const chainId = useChainId();
  const connection = useConnection();
  const writeContract = useWriteContract();

  const executeWrite = useCallback(
    async (params: ExecuteWriteParams): Promise<ExecuteResult | undefined> => {
      if (!chainId) {
        return undefined;
      }

      const { options, ...contractParams } = params;
      const resolvedContract = resolveContract(chainId, contractParams);

      if (!resolvedContract) {
        return undefined;
      }

      const shouldSimulate = options?.simulate ?? true;

      if (shouldSimulate) {
        const simulationAccount =
          options?.simulationAccount ?? connection.address;

        try {
          await simulateContractCall({
            chainId,
            ...contractParams,
            account: simulationAccount,
          });
        } catch (error) {
          console.log("error:", error);
          
          throw Object.assign(new Error("Transaction rejected"), {
            phase: "simulation" as const,
            cause: error,
          });
        }
      }

      const hash = await writeContract.mutateAsync({
        abi: resolvedContract.abi,
        address: resolvedContract.address,
        functionName: params.functionName,
        args: [...(params.args ?? [])],
      });

      if (!options?.waitForReceipt) {
        return { hash };
      }

      const publicClient = getPublicClient(chainId);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: options?.confirmations ?? 1,
      });

      return { hash, receipt };
    },
    [chainId, connection.address, writeContract],
  );

  return {
    executeWrite,
  };
};

export default useWriteContracts;
