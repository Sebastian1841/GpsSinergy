export const parseNumberFromLabel = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback
  }

  const match = String(value)
    .replace(",", ".")
    .match(/-?\d+(\.\d+)?/)

  if (!match) return fallback

  const parsedValue = Number(match[0])

  return Number.isFinite(parsedValue) ? parsedValue : fallback
}
