import { useCallback } from "react";
import type { Abi, Address } from "viem";
import { useChainId } from "wagmi";
import { getPublicClient } from "@/lib";
import {
  type ProtocolContractGetterName,
  resolveProtocolContract,
} from "./protocolContracts";

type ExecuteReadParams = {
  functionName: string;
  functionContract: ProtocolContractGetterName;
  args?: readonly unknown[];
  account?: Address;
  address?: Address;
};

const useProtocolReadExecutor = () => {
  const chainId: number = useChainId();

  const executeRead = useCallback(async ({
    functionName,
    functionContract,
    args,
    account,
    address,
  }: ExecuteReadParams) => {
    try {
      if (!chainId) {
        return undefined;
      }

      const resolvedContract = resolveProtocolContract(chainId, functionContract);

      if (!resolvedContract) {
        return undefined;
      }

      const publicClient = getPublicClient(chainId);

      return await publicClient.readContract({
        abi: resolvedContract.abi,
        address: address ?? resolvedContract.address,
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
    } catch {
      return undefined;
    }
  }, [chainId]);

  return {
    executeRead,
  };
};

export default useProtocolReadExecutor;
