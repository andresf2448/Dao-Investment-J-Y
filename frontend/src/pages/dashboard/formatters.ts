export function formatBondingStatus(value: "active" | "finalized") {
  return value === "active" ? "Active" : "Finalized";
}

export function formatEnabledStatus(value: "enabled" | "paused") {
  return value === "enabled" ? "Enabled" : "Paused";
}

export function formatExecutionStatus(value: "monitoring" | "paused") {
  return value === "monitoring" ? "Monitoring" : "Paused";
}
