import type {
  GuardianContractDetail,
  GuardianStatus,
} from "@/types/guardian";
import { GuardianContractStatus } from "@/types/guardian";

const contractStatusMap: Record<GuardianContractStatus, GuardianStatus> = {
  [GuardianContractStatus.Inactive]: "inactive",
  [GuardianContractStatus.Pending]: "pending",
  [GuardianContractStatus.Active]: "active",
  [GuardianContractStatus.Rejected]: "rejected",
  [GuardianContractStatus.Resigned]: "resigned",
  [GuardianContractStatus.Banned]: "banned",
};

export function isGuardianContractDetail(
  value: unknown,
): value is GuardianContractDetail {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<GuardianContractDetail>;

  return (
    typeof candidate.status === "number" &&
    typeof candidate.balance === "bigint" &&
    typeof candidate.blockRequest === "bigint" &&
    (typeof candidate.proposalId === "bigint" || candidate.proposalId === null)
  );
}

export function getGuardianStatus(statusValue: number | undefined): GuardianStatus {
  if (statusValue === undefined || !(statusValue in contractStatusMap)) {
    return "inactive";
  }

  return contractStatusMap[statusValue as GuardianContractStatus];
}

export function getGuardianProposalState(statusValue: number | undefined): string {
  switch (statusValue) {
    case GuardianContractStatus.Pending:
      return "Pending Governance Review";
    case GuardianContractStatus.Active:
      return "Approved";
    case GuardianContractStatus.Rejected:
      return "Rejected";
    case GuardianContractStatus.Resigned:
      return "Resigned";
    case GuardianContractStatus.Banned:
      return "Banned";
    case GuardianContractStatus.Inactive:
    default:
      return "—";
  }
}
