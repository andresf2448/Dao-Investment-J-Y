export type GuardianStatus =
  | "inactive"
  | "pending"
  | "active"
  | "rejected"
  | "resigned"
  | "banned";

export enum GuardianContractStatus {
  Inactive,
  Pending,
  Active,
  Rejected,
  Resigned,
  Banned,
}

export interface GuardianDetail {
  status: GuardianStatus;
  balance: number | bigint;
  blockRequest: number;
  proposalId: number | null;
}

export interface GuardianContractDetail {
  status: number;
  balance: bigint;
  blockRequest: bigint;
  proposalId: bigint | null;
}

export interface GuardianState {
  status: GuardianStatus;
  requiredStake: string;
  bondedAmount: string;
  proposalState: string;
  canOperate: boolean;
}

export interface GuardianMetrics {
  activeGuardians: number;
  pendingApplications: number;
  escrowBalance: string;
  escrowCoverage: string;
}
