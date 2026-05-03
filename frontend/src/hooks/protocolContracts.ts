import type { Abi, Address } from "viem";
import {
  protocolContractGetters,
  type ProtocolContractGetterName,
} from "./definitions/protocolContracts";

export type ResolvedProtocolContract = {
  abi: Abi;
  address: Address;
};

export function resolveProtocolContract(
  chainId: number,
  getterName: ProtocolContractGetterName,
): ResolvedProtocolContract | undefined {
  try {
    const contract = protocolContractGetters[getterName](chainId);
    const address = contract?.address as Address | undefined;
    const abi = contract?.abi as Abi | undefined;

    if (!address || !abi?.length) {
      return undefined;
    }

    return {
      abi,
      address,
    };
  } catch {
    return undefined;
  }
}
