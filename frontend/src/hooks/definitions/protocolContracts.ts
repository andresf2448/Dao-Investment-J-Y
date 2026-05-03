import {
  getDaoGovernorContract,
  getGenesisBondingContract,
  getGovernanceTokenContract,
  getGuardianAdministratorContract,
  getGuardianBondEscrowContract,
  getProtocolCoreContract,
  getRiskManagerContract,
  getStrategyRouterContract,
  getTreasuryContract,
  getVaultRegistryContract,
  getVaultImplementationContract,
} from "@dao/contracts-sdk";
import { getVaultFactoryContract } from "../getVaultFactoryContract";

export const protocolContractGetters = {
  getGenesisBondingContract,
  getProtocolCoreContract,
  getVaultRegistryContract,
  getTreasuryContract,
  getDaoGovernorContract,
  getRiskManagerContract,
  getStrategyRouterContract,
  getGovernanceTokenContract,
  getGuardianAdministratorContract,
  getGuardianBondEscrowContract,
  getVaultFactoryContract,
  getVaultImplementationContract,
} as const;

export type ProtocolContractGetterName = keyof typeof protocolContractGetters;
