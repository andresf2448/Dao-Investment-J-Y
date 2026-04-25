export type ProposalStatus =
  | "Pending"
  | "Active"
  | "Succeeded"
  | "Queued"
  | "Executed"
  | "Defeated"
  | "Canceled"
  | "Expired";

export interface ProposalVotes {
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
}

export interface ProposalAction {
  target: string;
  value: string;
  calldata: string;
}

export interface ProposalTimeline {
  label: string;
  value: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: ProposalStatus;
  proposer: string;
  votes: ProposalVotes;
  actions: ProposalAction[];
  timeline: ProposalTimeline[];
  endDate: string;
  executionEta: string;
}

export interface GovernanceProposalSummary {
  id: string;
  title: string;
  status: ProposalStatus;
  votes: string;
  endDate: string;
}

export interface GovernanceConfig {
  proposalThreshold: string;
  votingDelay: string;
  votingPeriod: string;
}

export interface GovernanceMetrics {
  activeProposals: number;
  queuedProposals: number;
  executedProposals: number;
  participation: string;
}

export interface GovernanceUserState {
  votingPower: string;
  governanceTokenBalance: string;
  meetsProposalThreshold: boolean;
  hasGovernanceTokens: boolean;
}

export interface GovernanceModel {
  config: GovernanceConfig;
  metrics: GovernanceMetrics;
  proposals: GovernanceProposalSummary[];
  user: GovernanceUserState;
  capabilities: import("./capabilities").ProtocolCapabilities;
}
