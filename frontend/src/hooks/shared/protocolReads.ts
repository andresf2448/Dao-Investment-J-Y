import type { Abi, Address } from "viem";
import type { ProtocolContractGetterName } from "../definitions/protocolContracts";
import type { ContractReferenceWithOptionalAddress } from "./resolveContract";

export type ProtocolReadArgs<TContext> =
  | readonly unknown[]
  | ((context: TContext) => readonly unknown[] | undefined);

export type ProtocolContractSpec =
  | ProtocolContractGetterName
  | ContractReferenceWithOptionalAddress;

export type ProtocolReadDefinition<
  TKey extends string = string,
  TContext = void,
> = {
  key: TKey;
  contract: ProtocolContractSpec;
  functionName: string;
  args?: ProtocolReadArgs<TContext>;
};

type ProtocolReadPrimitive = bigint | boolean | string | void;

type ProtocolReadArray = readonly unknown[] | readonly Address[];

export type ProtocolReadValue =
  | ProtocolReadPrimitive
  | ProtocolReadArray
  | undefined;

export type ProtocolReadsResult<TKey extends string> = Record<
  TKey,
  ProtocolReadValue
>;

export type ProtocolReadsHookResult<TKey extends string> =
  ProtocolReadsResult<TKey> & {
    refetch: () => Promise<unknown>;
  };

export type ResolvedProtocolReadDefinition<TKey extends string = string> = {
  key: TKey;
  contract: ProtocolContractSpec;
  functionName: string;
  args?: readonly unknown[];
};

export type ProtocolReadContractConfig<TKey extends string = string> = {
  key: TKey;
  abi: Abi;
  address: Address;
  functionName: string;
  args?: readonly unknown[];
};

export function isValidProtocolReadContractConfig<TKey extends string>(
  value: ProtocolReadContractConfig<TKey> | undefined,
): value is ProtocolReadContractConfig<TKey> {
  return !!value && !!value.address && value.abi.length > 0;
}

export function resolveDefinitionArgs<TContext>(
  args: ProtocolReadArgs<TContext> | undefined,
  context: TContext | undefined,
) {
  if (typeof args === "function") {
    return args(context as TContext);
  }

  return args;
}
