import type { Address } from "viem";

export interface ProtocolDeploymentAddresses {
  chainId: number;
  daoGovernor: Address;
  genesisBonding: Address;
  governanceToken: Address;
  guardianAdministrator: Address;
  guardianBondEscrow: Address;
  protocolCore: Address;
  riskManager: Address;
  strategyRouter: Address;
  timeLock: Address;
  treasury: Address;
  vaultFactory: Address;
  vaultRegistry: Address;
}

export const anvilDeploymentAddresses: ProtocolDeploymentAddresses = {
  chainId: 31337,
  daoGovernor: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
  genesisBonding: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  governanceToken: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  guardianAdministrator: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
  guardianBondEscrow: "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c",
  protocolCore: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  riskManager: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
  strategyRouter: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1",
  timeLock: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  treasury: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  vaultFactory: "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f",
  vaultRegistry: "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d",
};

export function getProtocolDeploymentAddresses(
  chainId: number,
): ProtocolDeploymentAddresses | undefined {
  if (chainId === anvilDeploymentAddresses.chainId) {
    return anvilDeploymentAddresses;
  }

  return undefined;
}
