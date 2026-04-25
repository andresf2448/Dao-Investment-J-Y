import type { ProposalStatus } from "@/types/governance";

export function mapGovernorProposalState(
  value: number | bigint | undefined,
): ProposalStatus {
  switch (Number(value ?? -1)) {
    case 0:
      return "Pending";
    case 1:
      return "Active";
    case 2:
      return "Canceled";
    case 3:
      return "Defeated";
    case 4:
      return "Succeeded";
    case 5:
      return "Queued";
    case 6:
      return "Expired";
    case 7:
      return "Executed";
    default:
      return "Pending";
  }
}

export function getRecentProposalIndexes(
  proposalCount: bigint,
  limit = 10,
): number[] {
  const safeCount = Number(proposalCount);
  const fromIndex = Math.max(0, safeCount - limit);

  return Array.from(
    { length: Math.max(0, safeCount - fromIndex) },
    (_, index) => fromIndex + index,
  ).reverse();
}
