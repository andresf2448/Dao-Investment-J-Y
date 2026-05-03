import { useMemo } from "react";
import { useChainId, useReadContracts } from "wagmi";
import { getReadResultValue } from "./shared/contractResults";
import { resolveContract } from "./shared/resolveContract";
import type {
  ProtocolReadContractConfig,
  ProtocolReadDefinition,
  ProtocolReadsHookResult,
  ProtocolReadsResult,
  ProtocolReadValue,
  ResolvedProtocolReadDefinition,
} from "./shared/protocolReads";
import {
  isValidProtocolReadContractConfig,
  resolveDefinitionArgs,
} from "./shared/protocolReads";

export function useProtocolReads<TKey extends string, TContext = void>(
  definitions: readonly ProtocolReadDefinition<TKey, TContext>[],
  context?: TContext,
): ProtocolReadsHookResult<TKey> {
  const chainId = useChainId();

  const resolvedDefinitions = useMemo<ResolvedProtocolReadDefinition<TKey>[]>(() => {
    return definitions.reduce<ResolvedProtocolReadDefinition<TKey>[]>((accumulator, definition) => {
      const resolvedArgs = resolveDefinitionArgs(definition.args, context);

      if (definition.args && resolvedArgs === undefined) {
        return accumulator;
      }

      accumulator.push({
        key: definition.key,
        contract: definition.contract,
        functionName: definition.functionName,
        args: resolvedArgs,
      });

      return accumulator;
    }, []);
  }, [context, definitions]);

  const contracts = useMemo<ProtocolReadContractConfig<TKey>[]>(() => {
    if (!chainId || resolvedDefinitions.length === 0) {
      return [];
    }

    const resolvedContracts = resolvedDefinitions
      .map((definition) => {
        const contract =
          typeof definition.contract === "string"
            ? resolveContract(chainId, {
                functionContract: definition.contract,
              })
            : resolveContract(chainId, definition.contract);

        if (!contract || !contract.address) {
          return undefined;
        }

        return {
          key: definition.key,
          ...contract,
          functionName: definition.functionName,
          args: definition.args,
        };
      })
      .filter(isValidProtocolReadContractConfig);

    return resolvedContracts as ProtocolReadContractConfig<TKey>[];
  }, [chainId, resolvedDefinitions]);

  const { data, refetch } = useReadContracts({
    allowFailure: true,
    contracts: contracts as readonly ProtocolReadContractConfig<TKey>[],
    query: {
      enabled: contracts.length > 0,
    },
  });

  const initialResult = useMemo(() => {
    return definitions.reduce((accumulator, definition) => {
      accumulator[definition.key] = undefined;
      return accumulator;
    }, {} as ProtocolReadsResult<TKey>);
  }, [definitions]);

  return useMemo(() => {
    const values = contracts.reduce((accumulator, contract, index) => {
      accumulator[contract.key] = getReadResultValue<ProtocolReadValue>(
        data?.[index],
      );
      return accumulator;
    }, { ...initialResult });

    return {
      ...values,
      refetch,
    };
  }, [contracts, data, initialResult, refetch]);
}
