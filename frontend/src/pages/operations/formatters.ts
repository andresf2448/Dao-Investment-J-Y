export function formatOperationStatus(value: "enabled" | "paused") {
  return value === "enabled" ? "Enabled" : "Paused";
}

export function formatInfrastructureState(
  value: "linked" | "partial" | "unconfigured",
) {
  switch (value) {
    case "linked":
      return "Linked";
    case "partial":
      return "Partial";
    case "unconfigured":
      return "Unconfigured";
    default:
      return "Unknown";
  }
}
