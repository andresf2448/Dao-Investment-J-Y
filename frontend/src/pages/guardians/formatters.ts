import type { GuardianStatus } from "@/types/guardian";

export function formatGuardianStatus(status: GuardianStatus) {
  switch (status) {
    case "inactive":
      return "Not Applied";
    case "pending":
      return "Pending Approval";
    case "active":
      return "Active Guardian";
    case "rejected":
      return "Rejected";
    case "resigned":
      return "Resigned";
    case "banned":
      return "Banned";
    default:
      return "Unknown";
  }
}

export function getGuardianStatusBadge(status: GuardianStatus) {
  switch (status) {
    case "active":
      return "badge-success";
    case "pending":
      return "badge-warning";
    case "rejected":
    case "banned":
      return "badge-danger";
    default:
      return "rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white";
  }
}

export function getGuardianHelperText(status: GuardianStatus) {
  switch (status) {
    case "pending":
      return "Your application is currently under governance review.";
    case "active":
      return "You already have access to guardian operations.";
    case "rejected":
      return "Your previous application was not approved.";
    case "resigned":
      return "You are currently not active after resignation.";
    case "banned":
      return "Guardian access has been permanently restricted.";
    default:
      return "Connect your wallet to view your guardian eligibility and application status.";
  }
}
