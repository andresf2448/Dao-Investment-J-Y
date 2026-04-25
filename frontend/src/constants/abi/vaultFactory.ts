export const vaultFactoryAbi = [
  {
    type: "function",
    name: "router",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "core",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "guardianAdministrator",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "vaultRegistry",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "predictVaultAddress",
    stateMutability: "view",
    inputs: [
      { name: "guardian", type: "address" },
      { name: "asset", type: "address" },
    ],
    outputs: [
      { name: "salt", type: "bytes32" },
      { name: "predicted", type: "address" },
    ],
  },
  {
    type: "function",
    name: "isDeployed",
    stateMutability: "view",
    inputs: [
      { name: "guardian", type: "address" },
      { name: "asset", type: "address" },
    ],
    outputs: [
      { name: "predicted", type: "address" },
      { name: "deployed", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "createVault",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
    ],
    outputs: [
      { name: "vault", type: "address" },
      { name: "salt", type: "bytes32" },
    ],
  },
  {
    type: "function",
    name: "setRouter",
    stateMutability: "nonpayable",
    inputs: [{ name: "newRouter", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setCore",
    stateMutability: "nonpayable",
    inputs: [{ name: "newCore", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setGuardianAdministrator",
    stateMutability: "nonpayable",
    inputs: [{ name: "newGuardianAdministrator", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setVaultRegistry",
    stateMutability: "nonpayable",
    inputs: [{ name: "newVaultRegistry", type: "address" }],
    outputs: [],
  },
] as const;
