export type ExportedContract = {
  key: string
  contractName: string
  artifactPath: string
}

export const EXPORTED_CONTRACTS: ExportedContract[] = [
  {
    key: "genesisBonding",
    contractName: "GenesisBonding",
    artifactPath: "out/GenesisBonding.sol/GenesisBonding.json",
  },
  {
    key: "protocolCore",
    contractName: "ProtocolCore",
    artifactPath: "out/ProtocolCore.sol/ProtocolCore.json",
  },
  {
    key: "governanceToken",
    contractName: "GovernanceToken",
    artifactPath: "out/GovernanceToken.sol/GovernanceToken.json",
  },
  {
    key: "vaultRegistry",
    contractName: "VaultRegistry",
    artifactPath: "out/VaultRegistry.sol/VaultRegistry.json",
  },
  {
    key: "treasury",
    contractName: "Treasury",
    artifactPath: "out/Treasury.sol/Treasury.json",
  },
  {
    key: "strategyRouter",
    contractName: "StrategyRouter",
    artifactPath: "out/StrategyRouter.sol/StrategyRouter.json",
  },
]