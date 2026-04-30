import { useCallback } from "react";
import type { Address } from "viem";
import { useChainId } from "wagmi";
import { readContractCall } from "@/services/contractsService";
import { type ContractReferenceWithOptionalAddress } from "./shared/resolveContract";

export type ExecuteReadParams = ContractReferenceWithOptionalAddress & {
  functionName: string;
  args?: readonly unknown[];
  account?: Address;
};

const useContractReadExecutor = () => {
  const chainId: number = useChainId();

  const executeRead = useCallback(
    async (params: ExecuteReadParams) => {
      try {
        if (!chainId) {
          return undefined;
        }

        return await readContractCall({
          chainId,
          ...params,
        });
      } catch {
        return undefined;
      }
    },
    [chainId],
  );

  return {
    executeRead,
  };
};

export default useContractReadExecutor;
