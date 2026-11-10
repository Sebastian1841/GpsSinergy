export const matchesWorkOrderList = (status, list) => list === "open"
  ? ["scheduled", "in-progress", "waiting"].includes(status)
  : status === list
