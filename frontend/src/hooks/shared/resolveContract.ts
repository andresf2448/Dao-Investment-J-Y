import type { Abi, Address } from "viem";
import type { ProtocolContractGetterName } from "../definitions/protocolContracts";
import { resolveProtocolContract } from "../protocolContracts";

export function resolveOptionalContract<T>(
  chainId: number,
  getter: (chainId: number) => T,
): T | null {
  try {
    return getter(chainId);
  } catch {
    return null;
  }
}

type ResolvedContract = {
  abi: Abi;
  address: Address;
};

type ProtocolContractReference = {
  functionContract: ProtocolContractGetterName;
};

type CustomContractReference = {
  abi: Abi;
  address: Address;
};

function hasProtocolContract(
  value: ContractReferenceWithOptionalAddress,
): value is ProtocolContractReference {
  return "functionContract" in value;
}

export type ContractReferenceWithOptionalAddress =
  | (ProtocolContractReference & { address?: Address })
  | CustomContractReference;

export function resolveContract(
  chainId: number,
  contract: ContractReferenceWithOptionalAddress,
): ResolvedContract | undefined {
  if (hasProtocolContract(contract)) {
    const resolved = resolveProtocolContract(chainId, contract.functionContract);

    if (!resolved) {
      return undefined;
    }

    return {
      abi: resolved.abi,
      address: contract.address ?? resolved.address,
    };
  }

  if (!contract.abi?.length) {
    return undefined;
  }

  return {
    abi: contract.abi,
    address: contract.address,
  };
}
