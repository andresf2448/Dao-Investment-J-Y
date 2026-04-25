export function formatExecutionStatus(value: "monitoring" | "paused") {
  return value === "monitoring" ? "Monitoring" : "Paused";
}
