export const normalizeSignatureValue = (value) => {
  if (value === null || value === undefined) return ""

  return String(value)
}

export const buildCoordinatesSignature = (coordinates = []) => {
  if (!Array.isArray(coordinates)) return ""

  return coordinates
    .map((point) => {
      return [point?.lat, point?.lng].map(normalizeSignatureValue).join(":")
    })
    .join("|")
}
