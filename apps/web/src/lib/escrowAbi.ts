/** ABI matching PaylaneEscrow / PaylaneEscrowUpgradeable (proxy). */
export const escrowAbi = [
  {
    type: "function",
    name: "createJob",
    inputs: [
      { name: "jobRef", type: "bytes32" },
      { name: "worker", type: "address" },
      { name: "amount", type: "uint128" },
      { name: "deadline", type: "uint64" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "fundJob",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "assignWorker",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "worker", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "markDelivered",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "deliveryHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "platformFeeBps",
    inputs: [],
    outputs: [{ type: "uint16" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "accept",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "autoRelease",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "openDispute",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "jobs",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "client", type: "address" },
      { name: "worker", type: "address" },
      { name: "amount", type: "uint128" },
      { name: "deadline", type: "uint64" },
      { name: "deliveredAt", type: "uint64" },
      { name: "reviewWindow", type: "uint64" },
      { name: "status", type: "uint8" },
      { name: "deliveryHash", type: "bytes32" },
      { name: "funded", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "JobCreated",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "jobRef", type: "bytes32", indexed: false },
      { name: "client", type: "address", indexed: true },
      { name: "worker", type: "address", indexed: false },
      { name: "amount", type: "uint128", indexed: false },
      { name: "deadline", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "JobFunded",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "amount", type: "uint128", indexed: false },
    ],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
  },
] as const;
